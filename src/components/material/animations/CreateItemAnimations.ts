import { Interpolation, keyframes, Theme } from '@emotion/react'
import { Animation } from '@gamepark/react-client'
import { CreateItem, GridBoundaries, ItemMove, MaterialRules } from '@gamepark/rules-api'
import { fadeIn } from '../../../css'
import { defaultOrigin, getItemFromContext, getOriginDeltaPosition, ItemContext } from '../../../locators'
import { getFirstStockItem, getFirstStockItemTransforms } from './getFirstStockItemTransforms.util'
import { ItemAnimations, ItemContextWithTrajectory } from './ItemAnimations'
import { MaterialGameAnimationContext } from './MaterialGameAnimations'
import { toClosestRotations, toSingleRotation } from './rotations.utils'
import { Trajectory } from './Trajectory'
import { transformItem } from './transformItem.util'

const lastCreatedItemsIndexes: Record<string, number> = {}

export class CreateItemAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends ItemAnimations<P, M, L> {

  constructor(
    protected duration = 1,
    protected trajectory?: Trajectory<P, M, L>
  ) {
    super()
  }

  override getPreDuration(move: CreateItem<P, M, L>, context: MaterialGameAnimationContext<P, M, L>): number {
    const rules = new context.Rules(context.game, { player: context.playerId }) as MaterialRules<P, M, L>
    lastCreatedItemsIndexes[JSON.stringify(move)] = rules.mutator(move.itemType).getItemCreationIndex(move.item)
    return 0
  }

  override getPostDuration(move: CreateItem<P, M, L>, _context: MaterialGameAnimationContext<P, M, L>): number {
    const stringMove = JSON.stringify(move)
    setTimeout(() => delete lastCreatedItemsIndexes[stringMove], this.duration * 2000)
    return this.duration
  }

  getItemAnimation(context: ItemContext<P, M, L>, animation: Animation<CreateItem<P, M, L>>, boundaries: GridBoundaries): Interpolation<Theme> {
    if (!this.isItemToAnimate(context, animation)) return
    const stockItem = getFirstStockItem(context)
    const stockTransforms = getFirstStockItemTransforms(context)
    if (stockItem && stockTransforms.length) {
      const originTransforms = toSingleRotation(stockTransforms)
      const targetTransforms = toSingleRotation(transformItem(context))
      toClosestRotations(originTransforms, targetTransforms)
      const futureItem = getItemFromContext(context)
      const currentOrigin = context.locators[stockItem.location.type]?.getLocationOrigin(stockItem.location, context) ?? defaultOrigin
      const futureOrigin = context.locators[futureItem.location.type]?.getLocationOrigin(futureItem.location, context) ?? defaultOrigin
      if (currentOrigin.x !== futureOrigin.x) {
        originTransforms.unshift(`translateX(${-getOriginDeltaPosition(boundaries.xMin, boundaries.xMax, futureOrigin.x, currentOrigin.x)}em)`)
      }
      if (currentOrigin.y !== futureOrigin.y) {
        originTransforms.unshift(`translateY(${-getOriginDeltaPosition(boundaries.yMin, boundaries.yMax, futureOrigin.y, currentOrigin.y)}em)`)
      }

      // Check if trajectory is configured
      const contextWithTrajectory = context as ItemContextWithTrajectory<P, M, L>
      const trajectory = this.trajectory ?? contextWithTrajectory.trajectory

      if (trajectory) {
        const trajectoryContext: ItemContextWithTrajectory<P, M, L> = { ...context, trajectory }
        const animationKeyframes = this.getTrajectoryKeyframes(originTransforms, targetTransforms, animation, trajectoryContext)
        return this.getAnimationCssWithTrajectory(animationKeyframes, animation.duration, trajectory.easing)
      } else {
        const animationKeyframes = this.getTransformKeyframes(originTransforms.join(' '), targetTransforms.join(' '), animation, context)
        const description = context.material[context.type]
        return description?.getAnimationCss(animationKeyframes, animation.duration)
      }
    } else {
      return fadeIn(animation.duration)
    }
  }

  isItemToAnimate(context: ItemContext<P, M, L>, animation: Animation<CreateItem<P, M, L>>): boolean {
    const { type, index, displayIndex } = context
    if (animation.move.itemType !== type || lastCreatedItemsIndexes[JSON.stringify(animation.move)] !== index) return false
    const quantity = getItemFromContext(context).quantity ?? 1
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
