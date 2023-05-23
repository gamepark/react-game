import { useGame } from './useGame'
import { useContext, useMemo } from 'react'
import { Rules } from '@gamepark/rules-api'
import { gameContext } from '@gamepark/react-client'

export function useRules<T extends Rules>(): T | undefined {
  const context = useContext(gameContext)
  const Rules = context.RulesView || context.Rules
  const game = useGame()
  return useMemo(() => {
    if (!game) return
    return new Rules(game) as T
  }, [Rules, game])
}
