import { GamePageState } from '@gamepark/react-client'
import { useSelector } from 'react-redux'

export function usePlayerName<PlayerId = any>(playerId: PlayerId): string {
  return useSelector((state: GamePageState) => state.players.find(player => player.id === playerId ?? state.playerId)?.name ?? '')
}
