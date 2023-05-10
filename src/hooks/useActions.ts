import { DisplayedAction, GamePageState } from '@gamepark/react-client'
import { useSelector } from 'react-redux'

export const useActions = <Move = any, PlayerId = any>(): DisplayedAction<Move, PlayerId>[] | undefined =>
  useSelector((state: GamePageState<any, Move, PlayerId>) => state.actions)