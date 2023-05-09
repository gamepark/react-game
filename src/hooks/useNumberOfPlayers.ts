import { GamePageState } from '@gamepark/react-client'
import { useSelector } from 'react-redux'

export function useNumberOfPlayers(): number {
  return useSelector((state: GamePageState) => state.players.length)
}
