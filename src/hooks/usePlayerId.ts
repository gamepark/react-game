import { GamePageState } from '@gamepark/react-client'
import { useSelector } from 'react-redux'

export const usePlayerId = <PlayerId = any>(): PlayerId | undefined => useSelector((state: GamePageState<any, any, PlayerId>) => state.playerId)