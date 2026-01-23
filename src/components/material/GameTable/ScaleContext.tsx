import { createContext, ReactNode, useContext } from 'react'
import { useTransformContext } from 'react-zoom-pan-pinch'

const ScaleContext = createContext<number>(1)

export const useScale = () => useContext(ScaleContext)

export function ZoomScaleProvider({ children }: { children?: ReactNode }) {
  const { transformState } = useTransformContext()
  return (
    <ScaleContext.Provider value={transformState.scale}>
      {children}
    </ScaleContext.Provider>
  )
}

export function NoZoomScaleProvider({ children }: { children?: ReactNode }) {
  return (
    <ScaleContext.Provider value={1}>
      {children}
    </ScaleContext.Provider>
  )
}
