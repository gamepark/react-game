import { useGameSelector } from '@gamepark/react-client'
import { useIsAnimatingPlayerAction } from '../components/material/utils/useIsAnimatingPlayerAction'

const EMPTY_MOVES: never[] = []

type LegalMovesOptions<Move> = {
  predicate?: (move: Move) => boolean
  includeDuringAnimations?: boolean
}

export function useLegalMoves<Move = any>(predicateOrOptions?: ((move: Move) => boolean) | LegalMovesOptions<Move>): Move[] {
  const legalMoves = useGameSelector((state) => state.legalMoves)
  const gameOver = useGameSelector((state) => state.gameOver)
  const isAnimatingPlayerAction = useIsAnimatingPlayerAction()
  const { predicate, includeDuringAnimations } = typeof predicateOrOptions === 'function'
    ? { predicate: predicateOrOptions, includeDuringAnimations: false }
    : { predicate: predicateOrOptions?.predicate, includeDuringAnimations: predicateOrOptions?.includeDuringAnimations ?? false }
  if (gameOver || (!includeDuringAnimations && isAnimatingPlayerAction)) return EMPTY_MOVES
  return predicate ? legalMoves.filter(predicate) : legalMoves
}

export function useLegalMove<Move = any>(predicate?: (move: Move) => boolean): Move | undefined {
  const moves = useLegalMoves(predicate)
  return moves.length > 0 ? moves[0] : undefined
}
