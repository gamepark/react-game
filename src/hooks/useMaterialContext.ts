import { ItemLocator, MaterialContext } from '../locators'
import { useGame } from './useGame'
import { MaterialGame, MaterialRulesCreator } from '@gamepark/rules-api'
import { useContext, useMemo } from 'react'
import { gameContext, MaterialDescription } from '../components'
import { usePlayerId } from './usePlayerId'

export function useMaterialContext<P extends number = number, M extends number = number, L extends number = number>(): MaterialContext<P, M, L> {
  const game = useGame<MaterialGame<P, M, L>>()!
  const player = usePlayerId<P>()
  const context = useContext(gameContext)
  const Rules = context.Rules as MaterialRulesCreator<P, M, L>
  const material = context.material as Record<M, MaterialDescription<P, M, L>>
  const locators = context.locators as Record<L, ItemLocator<P, M, L>>
  return useMemo(() => ({ Rules, game, player, material, locators }), [Rules, game, player, material, locators])
}