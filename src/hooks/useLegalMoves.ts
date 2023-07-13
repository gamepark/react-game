import { useMemo } from 'react'
import { useRules } from './useRules'
import { usePlayerId } from './usePlayerId'

type Cache<Game = any, Move = any> = {
  game: Game
  moves: Move[]
}

const cache: Cache = {
  game: undefined,
  moves: []
}

export function useLegalMoves<Move = any>(predicate?: (move: Move) => boolean): Move[] {
  const rules = useRules()
  const playerId = usePlayerId()
  if (!rules || playerId === undefined) return []
  if (cache.game !== rules.game) {
    cache.game = rules.game
    cache.moves = rules.getLegalMoves(playerId)
  }
  return useMemo(() => predicate ? cache.moves.filter(predicate) : cache.moves, [cache.moves, predicate])
}

export function useLegalMove<Move = any>(predicate?: (move: Move) => boolean): Move | undefined {
  const moves = useLegalMoves(predicate)
  return moves.length > 0 ? moves[0] : undefined
}
