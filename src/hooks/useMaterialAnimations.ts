import { gameContext, MaterialAnimations, MaterialGameAnimations } from '../components'
import { useContext } from 'react'
import { Animations } from '@gamepark/react-client'

export function useMaterialAnimations<P extends number = number, M extends number = number, L extends number = number>(
  type: M
): MaterialAnimations<P, M, L> | undefined {
  const animations = useContext(gameContext).animations
  if (animations && isMaterialGameAnimations(animations)) {
    return animations.getMaterialAnimations(type)
  }
  return
}

function isMaterialGameAnimations(animations: Animations): animations is MaterialGameAnimations {
  return typeof (animations as MaterialGameAnimations).getMaterialAnimations === 'function'
}
