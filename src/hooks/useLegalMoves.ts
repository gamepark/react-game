import { useRules } from './useRules'
import { useMemo } from 'react'
import { usePlayerId } from './usePlayerId'

export const useLegalMoves = <Move = any, ReturnMove = Move>(predicate?: (move: Move) => boolean): ReturnMove[] => {
  const rules = useRules()
  const playerId = usePlayerId()
  return useMemo(() => {
    if (rules === undefined || playerId === undefined) return []
    const legalMoves = rules.getLegalMoves(playerId)
    return predicate ? legalMoves.filter(predicate) : legalMoves
  }, [rules, playerId])
}
