import { Interpolation, Theme } from '@emotion/react'
import { Animation } from '@gamepark/react-client'
import { GridBoundaries, MaterialItem, MaterialRulesCreator, MoveItemsAtOnce } from '@gamepark/rules-api'
import { defaultOrigin, getItemFromContext, getOriginDeltaPosition, ItemContext } from '../../../locators'
import { isDroppedItem } from '../utils/isDroppedItem'
import { isPlacedOnItem } from '../utils/isPlacedOnItem'
import { ItemAnimations, ItemContextWithTrajectory } from './ItemAnimations'
import { MaterialGameAnimationContext } from './MaterialGameAnimations'
import { toClosestRotations, toSingleRotation } from './rotations.utils'
import { Trajectory } from './Trajectory'
import { transformItem } from './transformItem.util'

export class MoveItemAtOnceAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends ItemAnimations<P, M, L> {

  constructor(
    protected duration = 1,
    protected trajectory?: Trajectory<P, M, L>,
    protected droppedItemDuration = 0.2
  ) {
    super()
  }

  override getPreDuration(move: MoveItemsAtOnce<P, M, L>, context: MaterialGameAnimationContext<P, M, L>): number {
    const potentialDroppedItems = move.indexes.map((index => ({ type: move.itemType, index })))
    if (potentialDroppedItems.some((item) => isDroppedItem(this.getItemContext(context, item)))) {
      return this.droppedItemDuration
    }
    return this.duration
  }

  getItemAnimation(context: ItemContext<P, M, L>, animation: Animation<MoveItemsAtOnce<P, M, L>>, boundaries: GridBoundaries): Interpolation<Theme> {
    if (context.type === animation.move.itemType && animation.move.indexes.includes(context.index)) {
      return this.getMovedItemAnimation(context, animation, boundaries)
    }
    const item = getItemFromContext(context)
    for (const index of animation.move.indexes) {
      const animatedItemContext = { ...context, type: animation.move.itemType, index }
      if (isPlacedOnItem(item, animatedItemContext)) {
        return this.getChildItemAnimation(item, context, animation)
      }
    }
  }

  getMovedItemAnimation(context: ItemContext<P, M, L>, animation: Animation<MoveItemsAtOnce<P, M, L>>, boundaries: GridBoundaries): Interpolation<Theme> {
    const { type, rules, material, player } = context
    const description = material[type]
    const Rules = rules.constructor as MaterialRulesCreator<P, M, L>
    const futureRules = new Rules(JSON.parse(JSON.stringify(rules.game)), { player })
    futureRules.play(animation.move)
    const futureItem = futureRules.material(type).getItem(context.index)!
    // TODO: if animation.move.quantity > 1, we will have to give a different target to each moving item. Formula bellow works only if 1 item moves
    const futureContext = { ...context, rules: futureRules, index: context.index, displayIndex: context.displayIndex }
    const targetTransforms = toSingleRotation(description?.getItemTransform(futureItem, futureContext) ?? [])
    const item = getItemFromContext(context)
    const currentOrigin = context.locators[item.location.type]?.getLocationOrigin(item.location, context) ?? defaultOrigin
    const futureOrigin = context.locators[futureItem.location.type]?.getLocationOrigin(futureItem.location, futureContext) ?? defaultOrigin
    if (currentOrigin.x !== futureOrigin.x) {
      targetTransforms.unshift(`translateX(${getOriginDeltaPosition(boundaries.xMin, boundaries.xMax, futureOrigin.x, currentOrigin.x)}em)`)
    }
    if (currentOrigin.y !== futureOrigin.y) {
      targetTransforms.unshift(`translateY(${getOriginDeltaPosition(boundaries.yMin, boundaries.yMax, futureOrigin.y, currentOrigin.y)}em)`)
    }

    // For dropped items, only specify the target keyframe (no origin) so CSS animates from the current visual position.
    if (isDroppedItem(context)) {
      const animationKeyframes = this.getKeyframesToDestination(targetTransforms.join(' '), animation, context)
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
      return description?.getAnimationCss(animationKeyframes, animation.duration)
    }
  }

  getChildItemAnimation(item: MaterialItem<P, L>, context: ItemContext<P, M, L>, animation: Animation<MoveItemsAtOnce<P, M, L>>): Interpolation<Theme> {
    const { type, rules, material, player } = context
    const description = material[type]
    const Rules = rules.constructor as MaterialRulesCreator<P, M, L>
    const futureRules = new Rules(JSON.parse(JSON.stringify(rules.game)), { player })
    futureRules.play(animation.move)
    const futureContext = { ...context, rules: futureRules }
    const targetTransforms = description?.getItemTransform(item, futureContext) ?? []

    // For children of dropped items, only specify the target keyframe (no origin).
    if (isDroppedItem(context)) {
      const animationKeyframes = this.getKeyframesToDestination(targetTransforms.join(' '), animation, context)
      return description?.getAnimationCss(animationKeyframes, animation.duration)
    }

    const originTransforms = transformItem(context)
    toClosestRotations(originTransforms, targetTransforms)

    const contextWithTrajectory = context as ItemContextWithTrajectory<P, M, L>
    const trajectory = this.trajectory ?? contextWithTrajectory.trajectory

    if (trajectory) {
      const trajectoryContext: ItemContextWithTrajectory<P, M, L> = { ...context, trajectory }
      const animationKeyframes = this.getTrajectoryKeyframes(originTransforms, targetTransforms, animation, trajectoryContext)
      return this.getAnimationCssWithTrajectory(animationKeyframes, animation.duration, trajectory.easing, trajectory.elevation)
    } else {
      const animationKeyframes = this.getTransformKeyframes(originTransforms.join(' '), targetTransforms.join(' '), animation, context)
      return description?.getAnimationCss(animationKeyframes, animation.duration)
    }
  }
}
