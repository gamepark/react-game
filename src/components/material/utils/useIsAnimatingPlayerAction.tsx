import { useAnimations, usePlayerId } from '../../../hooks'
import { MaterialMove } from '@gamepark/rules-api'

export const useIsAnimatingPlayerAction = (): boolean => {
  const player = usePlayerId()
  return useAnimations<MaterialMove>(animation => animation.action.playerId === player).length > 0
}