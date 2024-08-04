import { Interpolation, keyframes, Theme } from '@emotion/react'
import { Animation } from '@gamepark/react-client'
import { ItemMove, MaterialItem, MaterialRulesCreator, MoveItem } from '@gamepark/rules-api'
import { isEqual } from 'lodash'
import { centerLocator, ItemContext, Locator } from '../../../locators'
import { isDroppedItem } from '../utils/isDroppedItem'
import { isPlacedOnItem } from '../utils/isPlacedOnItem'
import { adjustRotation } from './adjustRotation'
import { isMovedOrDeletedItem } from './isMovedOrDeletedItem.util'
import { ItemAnimations } from './ItemAnimations'
import { movementAnimationCss } from './itemMovementCss.util'
import { MaterialGameAnimationContext } from './MaterialGameAnimations'
import { transformItem } from './transformItem.util'

export class MoveItemAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends ItemAnimations<P, M, L> {

  constructor(protected duration = 1, protected droppedItemDuration = 0.2) {
    super()
  }

  override getPreDuration(move: MoveItem<P, M, L>, context: MaterialGameAnimationContext<P, M, L>): number {
    const potentialDroppedItem = { type: move.itemType, index: move.itemIndex, displayIndex: context.game.droppedItem?.displayIndex ?? 0 }
    if (isDroppedItem(this.getItemContext(context, potentialDroppedItem))) {
      return this.droppedItemDuration
    }
    if (isEqual(context.game.items[move.itemType]?.[move.itemIndex]?.location, move.location)) {
      return 0 // item is moved where it is already (local move preview being validated for instance)
    }
    return this.duration
  }

  getItemAnimation(context: ItemContext<P, M, L>, animation: Animation<MoveItem<P, M, L>>): Interpolation<Theme> {
    if (isMovedOrDeletedItem(context, animation.move)) {
      return this.getMovedItemAnimation(context, animation)
    }
    const item = context.rules.material(context.type).getItem(context.index)!
    const animatedItemContext = { ...context, type: animation.move.itemType, index: animation.move.itemIndex }
    if (isPlacedOnItem(item, animatedItemContext)) {
      return this.getChildItemAnimation(item, context, animation)
    }
  }

  getMovedItemAnimation(context: ItemContext<P, M, L>, animation: Animation<MoveItem<P, M, L>>): Interpolation<Theme> {
    const { type, rules, locators, player } = context
    const Rules = rules.constructor as MaterialRulesCreator<P, M, L>
    const futureIndex = this.getItemIndexAfterMove(context, animation.move)
    const futureRules = new Rules(JSON.parse(JSON.stringify(rules.game)), { player })
    futureRules.play(animation.move)
    const futureItem = futureRules.material(type).getItem(futureIndex)!
    // TODO: if animation.move.quantity > 1, we will have to give a different target to each moving item. Formula bellow works only if 1 item moves
    const futureDisplayIndex = (futureItem.quantity ?? 1) - (animation.move.quantity ?? 1)
    const targetLocator = locators[futureItem.location.type] ?? centerLocator as unknown as Locator<P, M, L>
    const futureContext = { ...context, rules: futureRules, index: futureIndex, displayIndex: futureDisplayIndex }
    const sourceTransforms = transformItem(context)
    const sourceTransform = sourceTransforms.join(' ')
    const futureTransforms = targetLocator.transformItem(futureItem, futureContext)
    const futureTransform = adjustRotation(futureTransforms, sourceTransforms).join(' ')
    const animationKeyframes = this.getKeyframes(sourceTransform, futureTransform, animation, context)
    return movementAnimationCss(animationKeyframes, animation.duration)
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
    const { rules, locators, player } = context
    const Rules = rules.constructor as MaterialRulesCreator<P, M, L>
    const futureRules = new Rules(JSON.parse(JSON.stringify(rules.game)), { player })
    futureRules.play(animation.move)
    const targetLocator = locators[item.location.type] ?? centerLocator as unknown as Locator<P, M, L>
    const futureContext = { ...context, rules: futureRules }
    const sourceTransforms = transformItem(context)
    const sourceTransform = sourceTransforms.join(' ')
    const targetTransforms = targetLocator.transformItem(item, futureContext)
    const targetTransform = adjustRotation(targetTransforms, sourceTransforms).join(' ')
    const animationKeyframes = this.getKeyframes(sourceTransform, targetTransform, animation, context)
    return movementAnimationCss(animationKeyframes, animation.duration)
  }

  protected getKeyframes(origin: string, destination: string, _animation: Animation<ItemMove<P, M, L>>, _context: ItemContext<P, M, L>) {
    return keyframes`
      from {
        transform: ${origin};
      }
      to {
        transform: ${destination};
      }
    `
  }
}
