import { MaterialGame, MaterialMove, MaterialRules } from '@gamepark/rules-api'
import { useContext, useMemo } from 'react'
import { GameContext, gameContext } from '../components'
import { MaterialContext } from '../locators'
import { usePlayerId } from './usePlayerId'
import { useRules } from './useRules'

export function useMaterialContext<P extends number = number, M extends number = number, L extends number = number, R extends number = number, V extends number = number>(): MaterialContext<P, M, L, R, V> {
  const rules = useRules<MaterialRules<P, M, L, R, V>>()!
  const player = usePlayerId<P>()
  const context = useContext(gameContext) as unknown as GameContext<MaterialGame<P, M, L, R, V>, MaterialMove<P, M, L, R, V>, P, M, L>
  const material = context.material ?? {}
  const locators = context.locators ?? {}
  return useMemo(() => ({ rules, player, material, locators }), [rules, player, material, locators])
}