import { GamePageState } from '@gamepark/react-client'
import { useSelector } from 'react-redux'

export const useIsAnimatingPlayerAction = (): boolean => {
  return useSelector((state: GamePageState) => {
    if (state.playerId === undefined || !state.actions) return false
    return state.actions.some(action =>
      action.playerId === state.playerId && (action.pending || action.animation !== undefined)
    )
  })
}