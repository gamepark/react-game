import { gameContext, MaterialAnimations, MaterialGameAnimations } from '../components'
import { useContext } from 'react'
import { Animations } from '@gamepark/react-client'

export function useMaterialAnimations<P extends number = number, M extends number = number, L extends number = number>(
  type: M
): MaterialAnimations<P, M, L> | undefined {
  const animations = useContext(gameContext).animations
  if (animations && isMaterialGameAnimations<P, M, L>(animations)) {
    return animations.getMaterialAnimations(type)
  }
  return
}

function isMaterialGameAnimations<P extends number = number, M extends number = number, L extends number = number>(
  animations: Animations
): animations is MaterialGameAnimations<P, M, L> {
  return typeof (animations as MaterialGameAnimations).getMaterialAnimations === 'function'
}
