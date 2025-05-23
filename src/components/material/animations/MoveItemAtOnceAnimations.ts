import { Interpolation, Theme } from '@emotion/react'
import { Animation } from '@gamepark/react-client'
import { MaterialRulesCreator, MoveItemsAtOnce } from '@gamepark/rules-api'
import { ItemContext } from '../../../locators'
import { isDroppedItem } from '../utils/isDroppedItem'
import { ItemAnimations } from './ItemAnimations'
import { MaterialGameAnimationContext } from './MaterialGameAnimations'
import { toClosestRotations, toSingleRotation } from './rotations.utils'
import { transformItem } from './transformItem.util'

export class MoveItemAtOnceAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends ItemAnimations<P, M, L> {

  constructor(protected duration = 1, protected droppedItemDuration = 0.2) {
    super()
  }

  override getPreDuration(move: MoveItemsAtOnce<P, M, L>, context: MaterialGameAnimationContext<P, M, L>): number {
    const potentialDroppedItems = move.indexes.map((index => ({ type: move.itemType, index })))
    if (potentialDroppedItems.some((item) => isDroppedItem(this.getItemContext(context, item)))) {
      return this.droppedItemDuration
    }
    return this.duration
  }

  getItemAnimation(context: ItemContext<P, M, L>, animation: Animation<MoveItemsAtOnce<P, M, L>>): Interpolation<Theme> {
    if (context.type === animation.move.itemType && animation.move.indexes.includes(context.index)) {
      return this.getMovedItemAnimation(context, animation)
    }
  }

  getMovedItemAnimation(context: ItemContext<P, M, L>, animation: Animation<MoveItemsAtOnce<P, M, L>>): Interpolation<Theme> {
    const { type, rules, material, player } = context
    const description = material[type]
    const Rules = rules.constructor as MaterialRulesCreator<P, M, L>
    const futureRules = new Rules(JSON.parse(JSON.stringify(rules.game)), { player })
    futureRules.play(animation.move)
    const futureItem = futureRules.material(type).getItem(context.index)!
    // TODO: if animation.move.quantity > 1, we will have to give a different target to each moving item. Formula bellow works only if 1 item moves
    const futureContext = { ...context, rules: futureRules, index: context.index, displayIndex: context.displayIndex }
    const originTransforms = toSingleRotation(transformItem(context))
    const targetTransforms = toSingleRotation(description?.getItemTransform(futureItem, futureContext) ?? [])
    toClosestRotations(originTransforms, targetTransforms)
    const animationKeyframes = this.getTransformKeyframes(originTransforms.join(' '), targetTransforms.join(' '), animation, context)
    return description?.getAnimationCss(animationKeyframes, animation.duration)
  }
}
