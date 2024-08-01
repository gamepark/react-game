import { GamePageState } from '@gamepark/react-client'
import { useSelector } from 'react-redux'
import { useIsAnimatingPlayerAction } from '../components/material/utils/useIsAnimatingPlayerAction'


export function useLegalMoves<Move = any>(predicate?: (move: Move) => boolean): Move[] {
  const legalMoves = useSelector((state: GamePageState<any, Move>) => state.legalMoves)
  const gameOver = useSelector((state: GamePageState) => state.gameOver)
  const isAnimatingPlayerAction = useIsAnimatingPlayerAction()
  if (gameOver || isAnimatingPlayerAction) return []
  return predicate ? legalMoves.filter(predicate) : legalMoves
}

export function useLegalMove<Move = any>(predicate?: (move: Move) => boolean): Move | undefined {
  const moves = useLegalMoves(predicate)
  return moves.length > 0 ? moves[0] : undefined
}
