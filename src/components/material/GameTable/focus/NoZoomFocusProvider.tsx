import { ReactNode, useCallback, useMemo, useState } from 'react'
import { FocusContext, FocusContextType } from './FocusProvider'
import { MaterialFocus } from './MaterialFocus'

export function NoZoomFocusProvider({ children }: { children?: ReactNode }) {
  const [focus, setFocusState] = useState<MaterialFocus>()

  const setFocus = useCallback((newFocus?: MaterialFocus) => {
    setFocusState(newFocus)
  }, [])

  const focusRef = useCallback(() => {
    // No-op when zoom is disabled
  }, [])

  const value = useMemo<FocusContextType>(() => ({ focus, setFocus, focusRef }), [focus, setFocus, focusRef])

  return (
    <FocusContext.Provider value={value}>
      {children}
    </FocusContext.Provider>
  )
}
