import { useGame } from './useGame'
import { useContext, useMemo } from 'react'
import { Rules } from '@gamepark/rules-api'
import { gameContext } from '../components'
import { usePlayerId } from './usePlayerId'

export function useRules<T extends Rules>(): T | undefined {
  const Rules = useContext(gameContext).Rules
  const player = usePlayerId()
  const game = useGame()
  return useMemo(() => {
    if (!game) return
    return new Rules(game, { player }) as T
  }, [Rules, game])
}
