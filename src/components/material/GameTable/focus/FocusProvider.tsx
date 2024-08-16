/** @jsxImportSource @emotion/react */
import sumBy from 'lodash/sumBy'
import { createContext, FC, useCallback, useContext, useRef, useState } from 'react'
import { useControls } from 'react-zoom-pan-pinch'
import { useZoomToElements } from '../../../../hooks'
import { useLocators } from '../../../../hooks/useLocators'
import { ItemLocatorRecord } from '../../../../locators'
import { MaterialFocus } from './MaterialFocus'

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

export const FocusProvider: FC = ({ children }) => {
  const zoomToElements = useZoomToElements()
  const { resetTransform } = useControls()
  const locators = useLocators()

  const [focus, doSetFocus] = useState<MaterialFocus>()
  const focusRefs = useRef<Set<HTMLElement>>(new Set())
  const countFocusRef = useRef<number>(0)

  const setFocus = useCallback((focus?: MaterialFocus, reset: boolean = true) => {
    if (!focus && reset) {
      setTimeout(() => resetTransform(1000), 50)
    }
    focusRefs.current = new Set()
    countFocusRef.current = countFocusRefs(focus, locators)
    doSetFocus(focus)
  }, [])

  const doFocus = useCallback(() => {
    const elements = Array.from(focusRefs.current)
    setTimeout(() => zoomToElements(elements, { animationTime: focus?.animationTime ?? 1000, margin: focus?.margin, scale: focus?.scale }), 50)
  }, [zoomToElements])

  const focusRef = useCallback((ref: HTMLElement | null) => {
    if (!ref || focusRefs.current.has(ref)) return
    focusRefs.current.add(ref)
    if (countFocusRef.current === focusRefs.current.size) {
      doFocus()
    }
  }, [doFocus])

  return (
    <FocusContext.Provider value={{ focus, setFocus, focusRef }}>
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
    + sumBy(focus.staticItems, ({ item }) =>
      Math.min(item.quantity ?? 1, locators?.[item.location.type]?.limit ?? Infinity)
    )
    + focus.locations.length
}