import { useGameSelector } from '@gamepark/react-client'
import { useIsAnimatingPlayerAction } from '../components/material/utils/useIsAnimatingPlayerAction'

const EMPTY_MOVES: never[] = []

export function useLegalMoves<Move = any>(predicate?: (move: Move) => boolean): Move[] {
  const legalMoves = useGameSelector((state) => state.legalMoves)
  const gameOver = useGameSelector((state) => state.gameOver)
  const isAnimatingPlayerAction = useIsAnimatingPlayerAction()
  if (gameOver || isAnimatingPlayerAction) return EMPTY_MOVES
  return predicate ? legalMoves.filter(predicate) : legalMoves
}

export function useLegalMove<Move = any>(predicate?: (move: Move) => boolean): Move | undefined {
  const moves = useLegalMoves(predicate)
  return moves.length > 0 ? moves[0] : undefined
}
