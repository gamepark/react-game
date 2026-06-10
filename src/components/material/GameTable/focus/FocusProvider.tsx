import { useDndMonitor } from '@dnd-kit/core'
import { MaterialItem } from '@gamepark/rules-api'
import { flatten, sumBy } from 'es-toolkit'
import { values } from 'es-toolkit/compat'
import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { useControls } from 'react-zoom-pan-pinch'
import { useZoomToElements } from '../../../../hooks'
import { useLocators } from '../../../../hooks/useLocators'
import { ItemLocatorRecord } from '../../../../locators'
import { MaterialFocus, StaticItem } from './MaterialFocus'

export type FocusContextType<P extends number = number, M extends number = number, L extends number = number> = {
  focus?: MaterialFocus<P, M, L>
  setFocus: (focus?: MaterialFocus<P, M, L>, reset?: boolean) => void
  focusRef: (ref: HTMLElement | null) => void
}

export const FocusContext = createContext<FocusContextType | null>(null)

export const useFocusContext = <P extends number = number, M extends number = number, L extends number = number>(): FocusContextType<P, M, L> => {
  const focusContext = useContext(FocusContext) as unknown as FocusContextType<P, M, L>
  if (focusContext === null) {
    throw new Error('useFocusContext has to be used within a <FocusContext.Provider>')
  }
  return focusContext
}

export function FocusProvider({ children }: { children?: ReactNode }) {
  const zoomToElements = useZoomToElements()
  const { resetTransform } = useControls()
  const locators = useLocators()

  const [focus, doSetFocus] = useState<MaterialFocus>()
  const focusRefs = useRef<Set<HTMLElement>>(new Set())
  const countFocusRef = useRef<number>(0)
  const focusTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const focusStateRef = useRef<MaterialFocus | undefined>(focus)
  focusStateRef.current = focus
  const zoomToElementsRef = useRef(zoomToElements)
  zoomToElementsRef.current = zoomToElements

  // A focus must be applied (zoomed to) exactly once per setFocus call. Without this guard, any later
  // ref churn re-triggers the zoom: dragging a focused item re-renders it constantly (cleanup +
  // re-add of its ref), and the drop / snap-back re-renders it once more — each would otherwise zoom
  // back onto the item, making the focus jump during and after the drag. Reset on every setFocus.
  const focusAppliedRef = useRef(false)
  // While an item is being dragged it churns its ref nonstop; never apply focus mid-drag either.
  const draggingRef = useRef(false)
  useDndMonitor({
    onDragStart: () => { draggingRef.current = true },
    onDragEnd: () => { draggingRef.current = false },
    onDragCancel: () => { draggingRef.current = false }
  })

  const setFocus = useCallback((focus?: MaterialFocus, reset: boolean = true) => {
    if (!focus && reset) {
      setTimeout(() => resetTransform(1000), 50)
    }
    if (focusTimeout.current) clearTimeout(focusTimeout.current)
    focusRefs.current = new Set()
    focusAppliedRef.current = false
    countFocusRef.current = countFocusRefs(focus, locators)
    doSetFocus(focus)
  }, [])

  const doFocus = useCallback(() => {
    focusAppliedRef.current = true
    const focus = focusStateRef.current
    const elements = Array.from(focusRefs.current)
    setTimeout(() => zoomToElementsRef.current(elements, { animationTime: focus?.animationTime ?? 1000, margin: focus?.margin, scale: focus?.scale }), 50)
  }, [])

  const focusRef = useCallback((ref: HTMLElement | null) => {
    if (!ref || focusRefs.current.has(ref)) return
    focusRefs.current.add(ref)
    // Schedule the zoom only for the initial application of this focus, and never while dragging.
    // The same item can register more refs than `countFocusRef` predicts (e.g. StrictMode's
    // mount/unmount/remount in dev, or any re-render that replaces a node). Rather than firing the
    // instant the count is reached — which would zoom on an incomplete/early subset — debounce so
    // every ref committed in this render pass (and after a remount) is collected before zooming.
    if (!focusAppliedRef.current && !draggingRef.current && focusRefs.current.size >= countFocusRef.current) {
      if (focusTimeout.current) clearTimeout(focusTimeout.current)
      focusTimeout.current = setTimeout(doFocus)
    }
    // Return a cleanup so an unmounted node is removed from the set instead of lingering as a
    // detached, un-zoomable ghost (React 19 ref cleanup; react-merge-refs v3 forwards it too).
    return () => {
      focusRefs.current.delete(ref)
    }
  }, [])

  const value = useMemo(() => ({ focus, setFocus, focusRef }), [focus, setFocus, focusRef])

  return (
    <FocusContext.Provider value={value}>
      {children}
    </FocusContext.Provider>
  )
}

function countFocusRefs(focus?: MaterialFocus, locators?: Partial<ItemLocatorRecord>): number {
  if (!focus) return 0
  return sumBy(focus.materials, material =>
      sumBy(material.getItems(), item =>
        Math.min(item.quantity ?? 1, locators?.[item.location.type]?.limit ?? Infinity)
      )
    )
    + sumBy(getStaticItems(focus.staticItems), item =>
      Math.min(item.quantity ?? 1, locators?.[item.location.type]?.limit ?? Infinity)
    )
    + focus.locations.length
}

function getStaticItems(staticItems: StaticItem[] | Partial<Record<number, MaterialItem[]>>): MaterialItem[] {
  if (Array.isArray(staticItems)) {
    return staticItems.map(s => s.item)
  } else {
    return flatten(values(staticItems).map(value => value ?? []))
  }
}
