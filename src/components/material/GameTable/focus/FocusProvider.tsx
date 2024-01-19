/** @jsxImportSource @emotion/react */
import sumBy from 'lodash/sumBy'
import { createContext, FC, useCallback, useContext, useRef, useState } from 'react'
import { useControls } from 'react-zoom-pan-pinch'
import { useZoomToElements } from '../../../../hooks'
import { FocusableElement, isLocationBuilder, isMaterialFocus, isStaticItem } from './FocusableElement'

export type FocusContextType = {
  focus?: FocusableElement | FocusableElement[]
  setFocus: (focus?: FocusableElement | FocusableElement[]) => void
  addFocusRef: (ref: HTMLElement | null) => void
}

export const FocusContext = createContext<FocusContextType | null>(null)

export const useFocusContext = (): FocusContextType => {
  const focusContext = useContext(FocusContext)
  if (focusContext === null) {
    throw new Error('useFocusContext has to be used within a <FocusContext.Provider>')
  }
  return focusContext
}

export const FocusProvider: FC = ({ children }) => {
  const zoomToElements = useZoomToElements()
  const { resetTransform } = useControls()

  const [focus, doSetFocus] = useState<FocusableElement | FocusableElement[]>()
  const focusRefs = useRef<Set<HTMLElement>>(new Set())
  const countFocusRef = useRef<number>(0)

  const setFocus = useCallback((focus?: FocusableElement | FocusableElement[]) => {
    if (Array.isArray(focus) && focus.length === 0) {
      setTimeout(() => resetTransform(1000), 50)
    }
    focusRefs.current = new Set()
    countFocusRef.current = countFocusRefs(focus)
    doSetFocus(focus)
  }, [])

  const doFocus = useCallback(() => {
    const elements = Array.from(focusRefs.current)
    setTimeout(() => zoomToElements(elements, undefined, 1000), 50)
  }, [zoomToElements])

  const addFocusRef = useCallback((ref: HTMLElement | null) => {
    if (!ref || focusRefs.current.has(ref)) return
    focusRefs.current.add(ref)
    if (countFocusRef.current === focusRefs.current.size) {
      doFocus()
    }
  }, [doFocus])

  return (
    <FocusContext.Provider value={{ focus, setFocus, addFocusRef }}>
      {children}
    </FocusContext.Provider>
  )
}

function countFocusRefs(focus?: FocusableElement | FocusableElement[]): number {
  if (!focus) return 0
  if (Array.isArray(focus)) {
    return sumBy(focus, focus => countFocusRefs(focus))
  }
  if (isMaterialFocus(focus)) {
    return sumBy(focus.getItems(), item => item.quantity ?? 1)
  } else if (isStaticItem(focus)) {
    return focus.item.quantity ?? 1
  } else if (isLocationBuilder(focus)) {
    return 1
  } else {
    return 0
  }
}