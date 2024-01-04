import { Interpolation, keyframes, Theme } from '@emotion/react'
import { Animation } from '@gamepark/react-client'
import { CreateItem, ItemMove, itemsCanMerge } from '@gamepark/rules-api'
import { fadeIn } from '../../../css'
import { ItemContext } from '../../../locators'
import { adjustRotation } from './adjustRotation'
import { getFirstStockItemTransforms } from './getFirstStockItemTransforms.util'
import { ItemAnimations } from './ItemAnimations'
import { movementAnimationCss } from './itemMovementCss.util'
import { MaterialGameAnimationContext } from './MaterialGameAnimations'
import { transformItem } from './transformItem.util'

export class CreateItemAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends ItemAnimations<P, M, L> {

  constructor(protected duration = 1) {
    super()
  }

  override getPostDuration(_move: CreateItem<P, M, L>, _context: MaterialGameAnimationContext<P, M, L>): number {
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

  isItemToAnimate({ rules, type, index, displayIndex }: ItemContext<P, M, L>, animation: Animation<CreateItem<P, M, L>>): boolean {
    const item = rules.material(type).getItem(index)!
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