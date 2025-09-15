import { useGameSelector } from '@gamepark/react-client'

export const useNumberOfPlayers = (): number => useGameSelector((state) => state.players.length)
