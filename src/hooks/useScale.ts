import { useTransformContext, useTransformEffect } from 'react-zoom-pan-pinch'
import { useState } from 'react'

export function useScale(): number {
  const transformContext = useTransformContext()
  const [scale, setScale] = useState(transformContext.transformState.scale)
  useTransformEffect(({ state: { scale } }) => setScale(scale))
  return scale
}
