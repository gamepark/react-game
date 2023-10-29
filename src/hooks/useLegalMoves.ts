import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { GamePageState } from '../../../workshop/packages/react-client'
import { usePlayerId } from './usePlayerId'
import { useRules } from './useRules'

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
  const gameOver = useSelector((state: GamePageState) => state.gameOver)
  if (rules && playerId !== undefined && cache.game !== rules.game) {
    cache.game = rules.game
    cache.moves = rules.getLegalMoves(playerId)
  }
  return useMemo(() => {
      if (gameOver) return []
      return predicate ? cache.moves.filter(predicate) : cache.moves
    },
    [cache.moves, predicate, gameOver])
}

export function useLegalMove<Move = any>(predicate?: (move: Move) => boolean): Move | undefined {
  const moves = useLegalMoves(predicate)
  return moves.length > 0 ? moves[0] : undefined
}
