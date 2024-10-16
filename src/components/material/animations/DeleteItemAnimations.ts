import { css, Interpolation, keyframes, Theme } from '@emotion/react'
import { Animation } from '@gamepark/react-client'
import { DeleteItem, ItemMove, MoveItem } from '@gamepark/rules-api'
import { getItemFromContext, ItemContext } from '../../../locators'
import { isDroppedItem } from '../utils/isDroppedItem'
import { getFirstStockItemTransforms } from './getFirstStockItemTransforms.util'
import { ItemAnimations } from './ItemAnimations'
import { MaterialGameAnimationContext } from './MaterialGameAnimations'
import { toClosestRotations, toSingleRotation } from './rotations.utils'
import { transformItem } from './transformItem.util'

export class DeleteItemAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends ItemAnimations<P, M, L> {

  constructor(protected duration = 1, protected droppedItemDuration = 0.2) {
    super()
  }

  override getPreDuration(move: MoveItem<P, M, L>, context: MaterialGameAnimationContext<P, M, L>): number {
    const potentialDroppedItem = { type: move.itemType, index: move.itemIndex, displayIndex: context.game.droppedItem?.displayIndex ?? 0 }
    if (isDroppedItem(this.getItemContext(context, potentialDroppedItem))) {
      return this.droppedItemDuration
    }
    return this.duration
  }

  getItemAnimation(context: ItemContext<P, M, L>, animation: Animation<DeleteItem<M>>): Interpolation<Theme> {
    const item = getItemFromContext(context)
    const itemLocator = context.locators[item.location.type]
    if (!itemLocator?.isItemToAnimate(item, context, animation.move)) return
    const stockTransforms = getFirstStockItemTransforms(context)
    if (stockTransforms) {
      const originTransforms = toSingleRotation(transformItem(context))
      const targetTransforms = toSingleRotation(stockTransforms)
      toClosestRotations(originTransforms, targetTransforms)
      const animationKeyframes = this.getTransformKeyframes(originTransforms.join(' '), targetTransforms.join(' '), animation, context)
      const description = context.material[context.type]
      return description?.getAnimationCss(animationKeyframes, animation.duration)
    } else {
      const fadeout = keyframes`
        to {
          opacity: 0;
        }
      `
      return css`animation: ${fadeout} ${animation.duration}s ease-in-out forwards`
    }
  }

  protected getKeyframesToDestination(destination: string, _animation: Animation<ItemMove<P, M, L>>, _context: ItemContext<P, M, L>) {
    return keyframes`
      to {
        transform: ${destination};
      }
    `
  }
}