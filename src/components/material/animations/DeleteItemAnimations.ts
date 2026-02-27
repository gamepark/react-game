import { css, Interpolation, keyframes, Theme } from '@emotion/react'
import { Animation } from '@gamepark/react-client'
import { DeleteItem, GridBoundaries, MoveItem } from '@gamepark/rules-api'
import { defaultOrigin, getItemFromContext, getOriginDeltaPosition, ItemContext } from '../../../locators'
import { isDroppedItem } from '../utils/isDroppedItem'
import { getFirstStockItem, getFirstStockItemTransforms } from './getFirstStockItemTransforms.util'
import { ItemAnimations, ItemContextWithTrajectory } from './ItemAnimations'
import { MaterialGameAnimationContext } from './MaterialGameAnimations'
import { toClosestRotations, toSingleRotation } from './rotations.utils'
import { Trajectory } from './Trajectory'
import { transformItem } from './transformItem.util'

export class DeleteItemAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends ItemAnimations<P, M, L> {

  constructor(
    protected duration = 1,
    protected droppedItemDuration = 0.2,
    protected trajectory?: Trajectory<P, M, L>
  ) {
    super()
  }

  override getPreDuration(move: MoveItem<P, M, L>, context: MaterialGameAnimationContext<P, M, L>): number {
    const potentialDroppedItem = { type: move.itemType, index: move.itemIndex }
    if (isDroppedItem(this.getItemContext(context, potentialDroppedItem))) {
      return this.droppedItemDuration
    }
    return this.duration
  }

  getItemAnimation(context: ItemContext<P, M, L>, animation: Animation<DeleteItem<M>>, boundaries: GridBoundaries): Interpolation<Theme> {
    const item = getItemFromContext(context)
    const itemLocator = context.locators[item.location.type]
    if (!itemLocator?.isItemToAnimate(item, context, animation.move)) return
    const stockItem = getFirstStockItem(context)
    const stockTransforms = getFirstStockItemTransforms(context)
    if (stockItem && stockTransforms.length) {
      const targetTransforms = toSingleRotation(stockTransforms)
      const currentOrigin = context.locators[item.location.type]?.getLocationOrigin(item.location, context) ?? defaultOrigin
      const futureOrigin = context.locators[stockItem.location.type]?.getLocationOrigin(stockItem.location, context) ?? defaultOrigin
      if (currentOrigin.x !== futureOrigin.x) {
        targetTransforms.unshift(`translateX(${getOriginDeltaPosition(boundaries.xMin, boundaries.xMax, futureOrigin.x, currentOrigin.x)}em)`)
      }
      if (currentOrigin.y !== futureOrigin.y) {
        targetTransforms.unshift(`translateY(${getOriginDeltaPosition(boundaries.yMin, boundaries.yMax, futureOrigin.y, currentOrigin.y)}em)`)
      }

      // For dropped items, only specify the target keyframe (no origin) so CSS animates from the current visual position.
      if (isDroppedItem(context)) {
        const animationKeyframes = this.getKeyframesToDestination(targetTransforms.join(' '), animation, context)
        const description = context.material[context.type]
        return description?.getAnimationCss(animationKeyframes, animation.duration)
      }

      const originTransforms = toSingleRotation(transformItem(context))
      toClosestRotations(originTransforms, targetTransforms)

      // Check if trajectory is configured
      const contextWithTrajectory = context as ItemContextWithTrajectory<P, M, L>
      const trajectory = this.trajectory ?? contextWithTrajectory.trajectory

      if (trajectory) {
        const trajectoryContext: ItemContextWithTrajectory<P, M, L> = { ...context, trajectory }
        const animationKeyframes = this.getTrajectoryKeyframes(originTransforms, targetTransforms, animation, trajectoryContext)
        return this.getAnimationCssWithTrajectory(animationKeyframes, animation.duration, trajectory.easing, trajectory.elevation)
      } else {
        const animationKeyframes = this.getTransformKeyframes(originTransforms.join(' '), targetTransforms.join(' '), animation, context)
        const description = context.material[context.type]
        return description?.getAnimationCss(animationKeyframes, animation.duration)
      }
    } else {
      const fadeout = keyframes`
        to {
          opacity: 0;
        }
      `
      return css`animation: ${fadeout} ${animation.duration}s ease-in-out forwards`
    }
  }
}
