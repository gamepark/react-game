import { useSelector } from 'react-redux'
import { GamePageState } from '../../../../../workshop/packages/react-client'

export const useIsAnimatingPlayerAction = (): boolean => {
  return useSelector((state: GamePageState) => {
    if (state.playerId === undefined || !state.actions) return false
    return state.actions.some(action =>
      action.playerId === state.playerId && (action.delayed || action.animation !== undefined)
    )
  })
}