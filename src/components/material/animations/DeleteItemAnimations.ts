import { css, Interpolation, keyframes, Theme } from '@emotion/react'
import { Animation } from '@gamepark/react-client'
import { DeleteItem, ItemMove, MoveItem } from '@gamepark/rules-api'
import { ItemContext } from '../../../locators'
import { isDroppedItem } from '../utils/isDroppedItem'
import { adjustRotation } from './adjustRotation'
import { getFirstStockItemTransforms } from './getFirstStockItemTransforms.util'
import { isMovedOrDeletedItem } from './isMovedOrDeletedItem.util'
import { ItemAnimations } from './ItemAnimations'
import { movementAnimationCss } from './itemMovementCss.util'
import { MaterialGameAnimationContext } from './MaterialGameAnimations'
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
    if (!isMovedOrDeletedItem(context, animation.move)) return
    const stockLocation = getFirstStockItemTransforms(context)
    if (stockLocation) {
      const targetTransform = adjustRotation(stockLocation, transformItem(context)).join(' ')
      const animationKeyframes = this.getKeyframesToDestination(targetTransform, animation, context)
      return movementAnimationCss(animationKeyframes, animation.duration)
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