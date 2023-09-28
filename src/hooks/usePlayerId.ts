import { GamePageState } from '@gamepark/react-client'
import { shallowEqual, useSelector } from 'react-redux'

export const usePlayerId = <PlayerId = any>(): PlayerId | undefined => useSelector((state: GamePageState<any, any, PlayerId>) => state.playerId)

export const usePlayerIds = <PlayerId = any>(): PlayerId[] =>
  useSelector((state: GamePageState<any, any, PlayerId>) => state.players.map(p => p.id), shallowEqual)