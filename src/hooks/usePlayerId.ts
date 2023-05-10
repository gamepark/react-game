import { GamePageState } from '@gamepark/react-client'
import { useSelector } from 'react-redux'

export function usePlayerId<PlayerId = any>(): PlayerId | undefined {
  return useSelector((state: GamePageState<any, any, PlayerId>) => state.playerId)
}