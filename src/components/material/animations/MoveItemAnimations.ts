import { Interpolation, Theme } from '@emotion/react'
import { Animation } from '@gamepark/react-client'
import { GridBoundaries, MaterialItem, MaterialRulesCreator, MoveItem } from '@gamepark/rules-api'
import { isEqual } from 'es-toolkit'
import { defaultOrigin, getItemFromContext, getOriginDeltaPosition, ItemContext } from '../../../locators'
import { isDroppedItem } from '../utils/isDroppedItem'
import { isPlacedOnItem } from '../utils/isPlacedOnItem'
import { ItemAnimations } from './ItemAnimations'
import { MaterialGameAnimationContext } from './MaterialGameAnimations'
import { toClosestRotations, toSingleRotation } from './rotations.utils'
import { transformItem } from './transformItem.util'

export class MoveItemAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends ItemAnimations<P, M, L> {

  constructor(protected duration = 1, protected droppedItemDuration = 0.2) {
    super()
  }

  override getPreDuration(move: MoveItem<P, M, L>, context: MaterialGameAnimationContext<P, M, L>): number {
    const potentialDroppedItem = { type: move.itemType, index: move.itemIndex }
    if (isDroppedItem(this.getItemContext(context, potentialDroppedItem))) {
      return this.droppedItemDuration
    }
    if (isEqual(context.game.items[move.itemType]?.[move.itemIndex]?.location, move.location)) {
      return 0 // item is moved where it is already (local move preview being validated for instance)
    }
    return this.duration
  }

  getItemAnimation(context: ItemContext<P, M, L>, animation: Animation<MoveItem<P, M, L>>, boundaries: GridBoundaries): Interpolation<Theme> {
    const item = getItemFromContext(context)
    const itemLocator = context.locators[item.location.type]
    if (itemLocator?.isItemToAnimate(item, context, animation.move)) {
      return this.getMovedItemAnimation(context, animation, boundaries)
    }
    const animatedItemContext = { ...context, type: animation.move.itemType, index: animation.move.itemIndex }
    if (isPlacedOnItem(item, animatedItemContext)) {
      return this.getChildItemAnimation(item, context, animation)
    }
  }

  getMovedItemAnimation(context: ItemContext<P, M, L>, animation: Animation<MoveItem<P, M, L>>, boundaries: GridBoundaries): Interpolation<Theme> {
    const { type, rules, material, player } = context
    const description = material[type]
    const Rules = rules.constructor as MaterialRulesCreator<P, M, L>
    const futureIndex = this.getItemIndexAfterMove(context, animation.move)
    const futureRules = new Rules(JSON.parse(JSON.stringify(rules.game)), { player })
    futureRules.play(animation.move)
    const futureItem = futureRules.material(type).getItem(futureIndex)
    // TODO: if animation.move.quantity > 1, we will have to give a different target to each moving item. Formula bellow works only if 1 item moves
    const futureDisplayIndex = (futureItem.quantity ?? 1) - (animation.move.quantity ?? 1)
    const futureContext = { ...context, rules: futureRules, index: futureIndex, displayIndex: futureDisplayIndex }
    const currentTransforms = toSingleRotation(transformItem(context))
    const targetTransforms = toSingleRotation(description?.getItemTransform(futureItem, futureContext) ?? [])
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
    const animationKeyframes = this.getTransformKeyframes(currentTransforms.join(' '), targetTransforms.join(' '), animation, context)
    return description?.getAnimationCss(animationKeyframes, animation.duration)
  }

  getItemIndexAfterMove({ rules }: ItemContext<P, M, L>, move: MoveItem<P, M, L>): number {
    const items = rules.game.items[move.itemType]!
    const mutator = rules.mutator(move.itemType)
    const itemAfterMove = mutator.getItemAfterMove(move)
    const mergeIndex = mutator.findMergeIndex(itemAfterMove)
    if (mergeIndex !== -1) {
      return mergeIndex
    } else if ((items[move.itemIndex].quantity ?? 1) > (move.quantity ?? 1)) {
      const availableIndex = items.findIndex(item => item.quantity === 0)
      return availableIndex !== -1 ? availableIndex : items.length
    } else {
      return move.itemIndex
    }
  }

  getChildItemAnimation(item: MaterialItem<P, L>, context: ItemContext<P, M, L>, animation: Animation<MoveItem<P, M, L>>): Interpolation<Theme> {
    const { type, rules, material, player } = context
    const description = material[type]
    const Rules = rules.constructor as MaterialRulesCreator<P, M, L>
    const futureRules = new Rules(JSON.parse(JSON.stringify(rules.game)), { player })
    futureRules.play(animation.move)
    const futureContext = { ...context, rules: futureRules }
    const originTransforms = transformItem(context)
    const targetTransforms = description?.getItemTransform(item, futureContext) ?? []
    toClosestRotations(originTransforms, targetTransforms)
    const animationKeyframes = this.getTransformKeyframes(originTransforms.join(' '), targetTransforms.join(' '), animation, context)
    return description?.getAnimationCss(animationKeyframes, animation.duration)
  }
}
