import { useAnimations, usePlayerId } from '../../../hooks'
import { MaterialMove } from '../../../../../workshop/packages/rules-api'

export const useIsAnimatingPlayerAction = (): boolean => {
  const player = usePlayerId()
  return useAnimations<MaterialMove>(animation => animation.action.playerId === player).length > 0
}