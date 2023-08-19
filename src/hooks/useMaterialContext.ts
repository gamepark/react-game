import { ItemLocator, MaterialContext } from '../locators'
import { MaterialRules } from '@gamepark/rules-api'
import { useContext, useMemo } from 'react'
import { gameContext, MaterialDescription } from '../components'
import { usePlayerId } from './usePlayerId'
import { useRules } from './useRules'

export function useMaterialContext<P extends number = number, M extends number = number, L extends number = number>(): MaterialContext<P, M, L> {
  const rules = useRules<MaterialRules<P, M, L>>()!
  const player = usePlayerId<P>()
  const context = useContext(gameContext)
  const material = context.material as Record<M, MaterialDescription<P, M, L>>
  const locators = context.locators as Record<L, ItemLocator<P, M, L>>
  return useMemo(() => ({ rules, player, material, locators }), [rules, player, material, locators])
}