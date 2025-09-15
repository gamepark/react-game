import { useGameSelector } from '@gamepark/react-client'

export const useIsAnimatingPlayerAction = (): boolean => {
  return useGameSelector((state) => {
    if (state.playerId === undefined || !state.actions) return false
    return state.actions.some(action =>
      action.playerId === state.playerId && (action.pending || action.animation !== undefined)
    )
  })
}