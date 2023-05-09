import { DisplayedAction, GamePageState } from '@gamepark/react-client'
import { useSelector } from 'react-redux'

export function useActions<Move = any, PlayerId = any>(): DisplayedAction<Move, PlayerId>[] | undefined {
  return useSelector((state: GamePageState<any, Move, PlayerId>) => state.actions)
}