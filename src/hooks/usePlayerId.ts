import { useGameSelector } from '@gamepark/react-client'
import { shallowEqual } from 'react-redux'

export const usePlayerId = <PlayerId = any>(): PlayerId | undefined => useGameSelector((state) => state.playerId)

export const usePlayerIds = <PlayerId = any>(): PlayerId[] => useGameSelector((state) => state.players.map(p => p.id), shallowEqual)