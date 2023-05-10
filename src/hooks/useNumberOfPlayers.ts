import { GamePageState } from '@gamepark/react-client'
import { useSelector } from 'react-redux'

export const useNumberOfPlayers = (): number => useSelector((state: GamePageState) => state.players.length)
