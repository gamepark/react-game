import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { GamePageState } from '../../../workshop/packages/react-client'

export function useLegalMoves<Move = any>(predicate?: (move: Move) => boolean): Move[] {
  const legalMoves = useSelector((state: GamePageState) => state.legalMoves)
  return useMemo(() => predicate ? legalMoves.filter(predicate) : legalMoves, [legalMoves, predicate])
}

export function useLegalMove<Move = any>(predicate?: (move: Move) => boolean): Move | undefined {
  const moves = useLegalMoves(predicate)
  return moves.length > 0 ? moves[0] : undefined
}
