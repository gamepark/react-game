import { useDndMonitor } from '@dnd-kit/core'
import { MaterialItem } from '@gamepark/rules-api'
import { flatten, sumBy } from 'es-toolkit'
import { values } from 'es-toolkit/compat'
import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { useControls } from 'react-zoom-pan-pinch'
import { useMaterialContext, useZoomToElements } from '../../../../hooks'
import { ItemContext, MaterialContext } from '../../../../locators'
import { MaterialFocus, StaticItem } from './MaterialFocus'

export type FocusContextType<P extends number = number, M extends number = number, L extends number = number> = {
  focus?: MaterialFocus<P, M, L>
  setFocus: (focus?: MaterialFocus<P, M, L>, reset?: boolean) => void
  focusRef: (ref: HTMLElement | null) => void
}

export const FocusContext = createContext<FocusContextType | null>(null)

/** How long a focus waits for the refs it is still missing before zooming on the ones it has. */
const incompleteFocusDelay = 300

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
  const context = useMaterialContext()
  const contextRef = useRef(context)
  contextRef.current = context

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
    countFocusRef.current = countFocusRefs(focus, contextRef.current)
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
    // The count is only a hint: it can also overestimate, since the display drops nodes for reasons
    // countFocusRefs cannot all foresee. Missing the count therefore only holds the zoom back for a
    // while longer, instead of cancelling it: a focus that never quite adds up still happens, on
    // whatever it did get, rather than silently doing nothing at all.
    if (!focusAppliedRef.current && !draggingRef.current) {
      if (focusTimeout.current) clearTimeout(focusTimeout.current)
      focusTimeout.current = setTimeout(doFocus, focusRefs.current.size >= countFocusRef.current ? 0 : incompleteFocusDelay)
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

/**
 * How many refs the display is expected to register for a focus. Static items are always rendered, but a dynamic
 * item that its locator hides is not in the DOM at all, so it must not be counted (see {@link countItemRefs}).
 */
function countFocusRefs(focus: MaterialFocus | undefined, context: MaterialContext): number {
  if (!focus) return 0
  return sumBy(focus.materials, material =>
      sumBy(material.entries, ([index, item]) => countItemRefs(item, { ...context, type: material.type, index, displayIndex: 0 }))
    )
    + sumBy(getStaticItems(focus.staticItems), item => item.quantity ?? 1)
    + focus.locations.length
}

/**
 * The number of nodes {@link DynamicItemsDisplay} mounts for an item: one per unit of its quantity, minus the ones
 * the locator hides. A card beyond the 20 that a deck displays, or an item on a hidden parent, is removed from the
 * DOM entirely and will never register a focus ref, so counting it would leave the focus waiting forever.
 */
function countItemRefs(item: MaterialItem, itemContext: ItemContext): number {
  const locator = itemContext.locators[item.location.type]
  const quantity = item.quantity ?? 1
  if (!locator) return quantity
  let count = 0
  for (let displayIndex = 0; displayIndex < quantity; displayIndex++) {
    const context = { ...itemContext, displayIndex }
    // "hide" and "ignore" are aliases a game can override either way round, exactly as the display tests them.
    if (!locator.hide(item, context) && !locator.ignore(item, context)) count++
  }
  return count
}

function getStaticItems(staticItems: StaticItem[] | Partial<Record<number, MaterialItem[]>>): MaterialItem[] {
  if (Array.isArray(staticItems)) {
    return staticItems.map(s => s.item)
  } else {
    return flatten(values(staticItems).map(value => value ?? []))
  }
}
