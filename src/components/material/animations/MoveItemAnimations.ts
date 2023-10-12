import { Interpolation, keyframes, Theme } from '@emotion/react'
import { Animation } from '@gamepark/react-client'
import { ItemMove, MaterialItem, MaterialRulesCreator, MoveItem } from '@gamepark/rules-api'
import { centerLocator, ItemContext, ItemLocator } from '../../../locators'
import { isDroppedItem } from '../utils/isDroppedItem'
import { isPlacedOnItem } from '../utils/isPlacedOnItem'
import { adjustRotation } from './adjustRotation'
import { isMovedOrDeletedItem } from './isMovedOrDeletedItem.util'
import { ItemAnimations } from './ItemAnimations'
import { movementAnimationCss } from './itemMovementCss.util'
import { MaterialAnimationContext } from './MaterialGameAnimations'
import { transformItem } from './transformItem.util'

export class MoveItemAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends ItemAnimations<P, M, L> {

  constructor(protected duration = 1, protected droppedItemDuration = 0.2) {
    super()
  }

  override getPreDuration(move: MoveItem<P, M, L>, context: MaterialAnimationContext<P, M, L>): number {
    const potentialDroppedItem = { type: move.itemType, index: move.itemIndex, displayIndex: context.game.droppedItem?.displayIndex ?? 0 }
    if (isDroppedItem(this.getItemContext(context, potentialDroppedItem))) {
      return this.droppedItemDuration
    }
    return this.duration
  }

  getItemAnimation(context: ItemContext<P, M, L>, animation: Animation<MoveItem<P, M, L>>): Interpolation<Theme> {
    if (isMovedOrDeletedItem(context, animation.move)) {
      return this.getMovedItemAnimation(context, animation)
    }
    const item = context.rules.material(context.type).getItem(context.index)!
    if (isPlacedOnItem(item, { type: animation.move.itemType, index: animation.move.itemIndex }, context)) {
      return this.getChildItemAnimation(item, context, animation)
    }
  }

  getMovedItemAnimation(context: ItemContext<P, M, L>, animation: Animation<MoveItem<P, M, L>>): Interpolation<Theme> {
    const { type, rules, locators, player } = context
    const Rules = rules.constructor as MaterialRulesCreator<P, M, L>
    const futureRules = new Rules(JSON.parse(JSON.stringify(rules.game)), { player })
    const mutator = futureRules.mutator(type)
    const futureIndex = mutator.move(animation.move)
    const futureItem = futureRules.material(type).getItem(futureIndex)!
    // TODO: if animation.move.quantity > 1, we will have to give a different target to each moving item. Formula bellow works only if 1 item moves
    const futureDisplayIndex = (futureItem.quantity ?? 1) - (animation.move.quantity ?? 1)
    const targetLocator = locators[futureItem.location.type] ?? centerLocator as unknown as ItemLocator<P, M, L>
    const futureContext = { ...context, index: futureIndex, displayIndex: futureDisplayIndex }
    const targetTransforms = targetLocator.transformItem(futureItem, futureContext)
    const targetTransform = adjustRotation(targetTransforms, transformItem(context)).join(' ')
    const animationKeyframes = this.getKeyframesToDestination(targetTransform, animation, context)
    return movementAnimationCss(animationKeyframes, animation.duration)
  }

  getChildItemAnimation(item: MaterialItem<P, L>, context: ItemContext<P, M, L>, animation: Animation<MoveItem<P, M, L>>): Interpolation<Theme> {
    const { rules, locators, player } = context
    const Rules = rules.constructor as MaterialRulesCreator<P, M, L>
    const futureRules = new Rules(JSON.parse(JSON.stringify(rules.game)), { player })
    futureRules.play(animation.move)
    const targetLocator = locators[item.location.type] ?? centerLocator as unknown as ItemLocator<P, M, L>
    const futureContext = { ...context, rules: futureRules }
    const targetTransforms = targetLocator.transformItem(item, futureContext)
    const targetTransform = adjustRotation(targetTransforms, transformItem(context)).join(' ')
    const animationKeyframes = this.getKeyframesToDestination(targetTransform, animation, context)
    return movementAnimationCss(animationKeyframes, animation.duration)
  }

  protected getKeyframesToDestination(destination: string, _animation: Animation<ItemMove<P, M, L>>, _context: ItemContext<P, M, L>) {
    return keyframes`
      to {
        transform: ${destination};
      }
    `
  }
}
