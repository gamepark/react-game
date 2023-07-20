import { ItemAnimations } from './ItemAnimations'
import { CreateItem, ItemMove, itemsCanMerge, MaterialGame } from '@gamepark/rules-api'
import { Animation, AnimationContext } from '@gamepark/react-client'
import { ItemContext } from '../../../locators'
import { Interpolation, keyframes, Theme } from '@emotion/react'
import { fadeIn } from '../../../css'
import { getFirstStockItemTransforms } from './getFirstStockItemTransforms.util'
import { adjustRotation } from './adjustRotation'
import { transformItem } from './transformItem.util'
import { movementAnimationCss } from './itemMovementCss.util'

export class CreateItemAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends ItemAnimations<P, M, L> {

  constructor(protected duration = 1) {
    super()
  }

  override getPostDuration(_move: CreateItem<P, M, L>, _context: AnimationContext<MaterialGame<P, M, L>, ItemMove<P, M, L>, P>): number {
    return this.duration
  }

  getItemAnimation(context: ItemContext<P, M, L>, animation: Animation<CreateItem<P, M, L>>): Interpolation<Theme> {
    if (!this.isItemToAnimate(context, animation)) return
    const stockTransforms = getFirstStockItemTransforms(context)
    if (stockTransforms) {
      const targetTransform = adjustRotation(stockTransforms, transformItem(context)).join(' ')
      const animationKeyframes = this.getKeyframesFromOrigin(targetTransform, animation, context)
      return movementAnimationCss(animationKeyframes, animation.duration)
    } else {
      return fadeIn(animation.duration)
    }
  }

  isItemToAnimate({ game, type, index, displayIndex }: ItemContext<P, M, L>, animation: Animation<CreateItem<P, M, L>>): boolean {
    const item = game.items[type]![index]
    if (animation.move.itemType !== type || !itemsCanMerge(item, animation.move.item)) return false
    const quantity = item.quantity ?? 1
    const createdQuantity = animation.move.item.quantity ?? 1
    return displayIndex >= quantity - createdQuantity
  }

  protected getKeyframesFromOrigin(origin: string, _animation: Animation<ItemMove<P, M, L>>, _context: ItemContext<P, M, L>) {
    return keyframes`
      from {
        transform: ${origin};
      }
    `
  }
}