import { ItemContext } from '../../../locators'
import { Animation } from '@gamepark/react-client'
import { DeleteItem, ItemMove, MoveItem } from '@gamepark/rules-api'
import { css, Interpolation, keyframes, Theme } from '@emotion/react'
import { adjustRotation } from './adjustRotation'
import { transformItem } from './transformItem.util'
import { movementAnimationCss } from './itemMovementCss.util'
import { getFirstStockItemTransforms } from './getFirstStockItemTransforms.util'
import { ItemAnimations } from './ItemAnimations'
import { isMovedOrDeletedItem } from './isMovedOrDeletedItem.util'
import { MaterialAnimationContext } from './MaterialGameAnimations'
import { isDroppedItem } from '../utils/isDroppedItem'

export class DeleteItemAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends ItemAnimations<P, M, L> {

  constructor(protected duration = 1, protected droppedItemDuration = 0.2) {
    super()
  }

  override getPreDuration(move: MoveItem<P, M, L>, context: MaterialAnimationContext<P, M, L>): number {
    if (isDroppedItem({ ...context, type: move.itemType, index: move.itemIndex, displayIndex: context.game.droppedItem?.displayIndex ?? 0 })) {
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