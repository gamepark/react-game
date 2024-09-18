import { Interpolation, Theme } from '@emotion/react'
import { DisplayedItem, ItemMove } from '@gamepark/rules-api'
import { gameContext, MaterialGameAnimations } from '../components'
import { useContext } from 'react'
import { ItemContext } from '../locators'
import { useAnimations } from './useAnimations'
import { useMaterialContext } from './useMaterialContext'

export const useItemAnimation = <P extends number = number, M extends number = number, L extends number = number>(
  displayedItem: DisplayedItem<M>, dragTransform?: string
): Interpolation<Theme> => {
  const { type, index } = displayedItem
  const context = useMaterialContext<P, M, L>()
  const animationsConfig = useContext(gameContext).animations as MaterialGameAnimations<P, M, L>
  const animations = useAnimations<ItemMove<P, M, L>, P>()
  if (!animations.length) return
  const item = context.rules.material(type).getItem(index)
  if (!item || !animationsConfig) return
  const itemContext: ItemContext<P, M, L> = { ...context, ...displayedItem, dragTransform }
  for (const animation of animations) {
    const config = animationsConfig.getAnimationConfig(animation.move, { ...context, action: animation.action })
    const itemAnimation = config.getItemAnimation(itemContext, animation)
    if (itemAnimation) return itemAnimation
  }
  return
}