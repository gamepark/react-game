import { Interpolation, Theme } from '@emotion/react'
import { Animation } from '@gamepark/react-client'
import { GridBoundaries, MaterialItem, MaterialRulesCreator, MoveItem } from '@gamepark/rules-api'
import { isEqual } from 'es-toolkit'
import { defaultOrigin, getItemFromContext, getOriginDeltaPosition, ItemContext } from '../../../locators'
import { isDroppedItem } from '../utils/isDroppedItem'
import { isPlacedOnItem } from '../utils/isPlacedOnItem'
import { ItemAnimations, ItemContextWithTrajectory } from './ItemAnimations'
import { MaterialGameAnimationContext } from './MaterialGameAnimations'
import { toClosestRotations, toSingleRotation } from './rotations.utils'
import { Trajectory } from './Trajectory'
import { transformItem } from './transformItem.util'

export class MoveItemAnimations<P extends number = number, M extends number = number, L extends number = number, R extends number = number, V extends number = number>
  extends ItemAnimations<P, M, L, R, V> {

  constructor(
    protected duration = 1,
    protected droppedItemDuration = 0.2,
    protected trajectory?: Trajectory<P, M, L>
  ) {
    super()
  }

  override getPreDuration(move: MoveItem<P, M, L>, context: MaterialGameAnimationContext<P, M, L, R, V>): number {
    const potentialDroppedItem = { type: move.itemType, index: move.itemIndex }
    if (isDroppedItem(this.getItemContext(context, potentialDroppedItem))) {
      return this.droppedItemDuration
    }
    if (isEqual(context.game.items[move.itemType]?.[move.itemIndex]?.location, move.location)) {
      return 0 // item is moved where it is already (local move preview being validated for instance)
    }
    return this.duration
  }

  getItemAnimation(context: ItemContext<P, M, L, R, V>, animation: Animation<MoveItem<P, M, L>>, boundaries: GridBoundaries): Interpolation<Theme> {
    const item = getItemFromContext(context)
    const itemLocator = context.locators[item.location.type]
    if (itemLocator?.isItemToAnimate(item, context, animation.move)) {
      return this.getMovedItemAnimation(context, animation, boundaries)
    }
    const animatedItemContext = { ...context, type: animation.move.itemType, index: animation.move.itemIndex }
    if (isPlacedOnItem(item, animatedItemContext)) {
      return this.getChildItemAnimation(item, context, animation)
    }
    return this.getPreMoveSiblingAnimation(context, animation)
  }

  getMovedItemAnimation(context: ItemContext<P, M, L, R, V>, animation: Animation<MoveItem<P, M, L>>, boundaries: GridBoundaries): Interpolation<Theme> {
    const { type, rules, material, player } = context
    const description = material[type]
    const Rules = rules.constructor as MaterialRulesCreator<P, M, L, R, V>
    const futureIndex = this.getItemIndexAfterMove(context, animation.move)
    const futureRules = new Rules(JSON.parse(JSON.stringify(rules.game)), { player })
    futureRules.play(animation.move)
    const futureItem = futureRules.material(type).getItem(futureIndex)
    // TODO: if animation.move.quantity > 1, we will have to give a different target to each moving item. Formula bellow works only if 1 item moves
    const futureDisplayIndex = (futureItem.quantity ?? 1) - (animation.move.quantity ?? 1)
    const futureContext = { ...context, rules: futureRules, index: futureIndex, displayIndex: futureDisplayIndex }
    const targetTransforms = toSingleRotation(description?.getItemTransform(futureItem, futureContext) ?? [])

    // For dropped items, the drag transform is not available in the animation context,
    // so we only specify the target keyframe and let CSS animate from the current visual position (the drop position).
    // We prepend a translate3d(0,0,0) to match the inline style structure (which has the drag translate3d prefix),
    // so CSS can interpolate component-by-component instead of falling back to matrix decomposition (which causes rotation loops).
    if (isDroppedItem(context)) {
      const currentTransforms = toSingleRotation(transformItem(context))
      toClosestRotations(currentTransforms, targetTransforms)
      const item = getItemFromContext(context)
      const currentOrigin = context.locators[item.location.type]?.getLocationOrigin(item.location, context) ?? defaultOrigin
      const futureOrigin = context.locators[futureItem.location.type]?.getLocationOrigin(futureItem.location, futureContext) ?? defaultOrigin
      const deltaX = currentOrigin.x !== futureOrigin.x ? `${getOriginDeltaPosition(boundaries.xMin, boundaries.xMax, futureOrigin.x, currentOrigin.x)}em` : '0px'
      const deltaY = currentOrigin.y !== futureOrigin.y ? `${getOriginDeltaPosition(boundaries.yMin, boundaries.yMax, futureOrigin.y, currentOrigin.y)}em` : '0px'
      targetTransforms.unshift(`translate3d(${deltaX}, ${deltaY}, 0em)`)
      const animationKeyframes = this.getKeyframesToDestination(targetTransforms.join(' '), animation, context)
      return description?.getAnimationCss(animationKeyframes, animation.duration)
    }

    const currentTransforms = toSingleRotation(transformItem(context))
    toClosestRotations(currentTransforms, targetTransforms)
    const item = getItemFromContext(context)
    const currentOrigin = context.locators[item.location.type]?.getLocationOrigin(item.location, context) ?? defaultOrigin
    const futureOrigin = context.locators[futureItem.location.type]?.getLocationOrigin(futureItem.location, futureContext) ?? defaultOrigin
    if (currentOrigin.x !== futureOrigin.x) {
      targetTransforms.unshift(`translateX(${getOriginDeltaPosition(boundaries.xMin, boundaries.xMax, futureOrigin.x, currentOrigin.x)}em)`)
    }
    if (currentOrigin.y !== futureOrigin.y) {
      targetTransforms.unshift(`translateY(${getOriginDeltaPosition(boundaries.yMin, boundaries.yMax, futureOrigin.y, currentOrigin.y)}em)`)
    }

    // Check if trajectory is configured (either in this instance or in context)
    const contextWithTrajectory = context as ItemContextWithTrajectory<P, M, L, R, V>
    const trajectory = this.trajectory ?? contextWithTrajectory.trajectory

    if (trajectory) {
      // Use new trajectory-based animation (single div, integrated elevation)
      const trajectoryContext: ItemContextWithTrajectory<P, M, L, R, V> = { ...context, trajectory }
      const animationKeyframes = this.getTrajectoryKeyframes(currentTransforms, targetTransforms, animation, trajectoryContext)
      return this.getAnimationCssWithTrajectory(animationKeyframes, animation.duration, trajectory.easing, trajectory.elevation)
    } else {
      // Use legacy two-div animation
      const animationKeyframes = this.getTransformKeyframes(currentTransforms.join(' '), targetTransforms.join(' '), animation, context)
      return description?.getAnimationCss(animationKeyframes, animation.duration)
    }
  }

  getItemIndexAfterMove({ rules }: ItemContext<P, M, L, R, V>, move: MoveItem<P, M, L>): number {
    const items = rules.game.items[move.itemType]!
    const mutator = rules.mutator(move.itemType)
    const itemAfterMove = mutator.getItemAfterMove(move)
    const mergeIndex = mutator.findMergeIndex(itemAfterMove)
    if (mergeIndex !== -1) {
      return mergeIndex
    } else if ((items[move.itemIndex].quantity ?? 1) > (move.quantity ?? 1)) {
      return mutator.getItemCreationIndex(itemAfterMove, items[move.itemIndex]?.location?.player)
    } else {
      return move.itemIndex
    }
  }

  getChildItemAnimation(item: MaterialItem<P, L>, context: ItemContext<P, M, L, R, V>, animation: Animation<MoveItem<P, M, L>>): Interpolation<Theme> {
    const { type, rules, material, player } = context
    const description = material[type]
    const Rules = rules.constructor as MaterialRulesCreator<P, M, L, R, V>
    const futureRules = new Rules(JSON.parse(JSON.stringify(rules.game)), { player })
    futureRules.play(animation.move)
    const futureContext = { ...context, rules: futureRules }
    const targetTransforms = description?.getItemTransform(item, futureContext) ?? []

    // For children of dropped items, use to-only keyframes with matching structure
    if (isDroppedItem(context)) {
      const currentTransforms = toSingleRotation(transformItem(context))
      toClosestRotations(currentTransforms, targetTransforms)
      targetTransforms.unshift('translate3d(0px, 0px, 0em)')
      const animationKeyframes = this.getKeyframesToDestination(targetTransforms.join(' '), animation, context)
      return description?.getAnimationCss(animationKeyframes, animation.duration)
    }

    const originTransforms = transformItem(context)
    toClosestRotations(originTransforms, targetTransforms)

    // Check if trajectory is configured
    const contextWithTrajectory = context as ItemContextWithTrajectory<P, M, L, R, V>
    const trajectory = this.trajectory ?? contextWithTrajectory.trajectory

    if (trajectory) {
      const trajectoryContext: ItemContextWithTrajectory<P, M, L, R, V> = { ...context, trajectory }
      const animationKeyframes = this.getTrajectoryKeyframes(originTransforms, targetTransforms, animation, trajectoryContext)
      return this.getAnimationCssWithTrajectory(animationKeyframes, animation.duration, trajectory.easing, trajectory.elevation)
    } else {
      const animationKeyframes = this.getTransformKeyframes(originTransforms.join(' '), targetTransforms.join(' '), animation, context)
      return description?.getAnimationCss(animationKeyframes, animation.duration)
    }
  }
}
