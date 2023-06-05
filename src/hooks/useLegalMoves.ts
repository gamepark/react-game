import { useRules } from './useRules'
import { useMemo } from 'react'
import { usePlayerId } from './usePlayerId'

export function useLegalMoves<Move = any>(predicate?: (move: Move) => boolean): Move[] {
  const rules = useRules()
  const playerId = usePlayerId()
  return useMemo(() => {
    if (rules === undefined || playerId === undefined) return []
    const legalMoves = rules.getLegalMoves(playerId)
    return predicate ? legalMoves.filter(predicate) : legalMoves
  }, [rules, playerId])
}

export function useLegalMove<Move = any>(predicate?: (move: Move) => boolean): Move | undefined {
  const moves = useLegalMoves(predicate)
  return moves.length > 0 ? moves[0] : undefined
}
