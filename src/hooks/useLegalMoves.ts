import { useRules } from './useRules'
import { useMemo } from 'react'
import { usePlayerId } from './usePlayerId'

export function useLegalMoves<Move = any, ReturnMove = Move>(predicate?: (move: Move) => boolean): ReturnMove[] {
  const rules = useRules<any, Move, any>()
  const playerId = usePlayerId()
  return useMemo(() => {
    if (rules === undefined || playerId === undefined) return []
    const legalMoves = rules.getLegalMoves(playerId)
    return predicate ? legalMoves.filter(predicate) : legalMoves
  }, [rules, playerId])
}
