import { Interpolation, keyframes, Theme } from '@emotion/react'
import { Animation } from '@gamepark/react-client'
import { CreateItem, ItemMove, MaterialRules } from '@gamepark/rules-api'
import { fadeIn } from '../../../css'
import { ItemContext } from '../../../locators'
import { adjustRotation } from './adjustRotation'
import { getFirstStockItemTransforms } from './getFirstStockItemTransforms.util'
import { ItemAnimations } from './ItemAnimations'
import { movementAnimationCss } from './itemMovementCss.util'
import { MaterialGameAnimationContext } from './MaterialGameAnimations'
import { transformItem } from './transformItem.util'

const lastCreatedItemsIndexes: Record<string, number> = {}

export class CreateItemAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends ItemAnimations<P, M, L> {

  constructor(protected duration = 1) {
    super()
  }

  override getPreDuration(move: CreateItem<P, M, L>, context: MaterialGameAnimationContext<P, M, L>): number {
    const rules = new context.Rules(context.game, { player: context.playerId }) as MaterialRules<P, M, L>
    lastCreatedItemsIndexes[JSON.stringify(move)] = rules.mutator(move.itemType).getItemCreationIndex(move.item)
    return 0
  }

  override getPostDuration(move: CreateItem<P, M, L>, _context: MaterialGameAnimationContext<P, M, L>): number {
    setTimeout(() => delete lastCreatedItemsIndexes[JSON.stringify(move)], this.duration * 2000)
    return this.duration
  }

  getItemAnimation(context: ItemContext<P, M, L>, animation: Animation<CreateItem<P, M, L>>): Interpolation<Theme> {
    if (!this.isItemToAnimate(context, animation)) return
    const stockTransforms = getFirstStockItemTransforms(context)
    if (stockTransforms) {
      const targetTransform = adjustRotation(stockTransforms, transformItem(context)).join(' ')
      const animationKeyframes = this.getKeyframesFromOrigin(targetTransform, animation, context)
      return movementAnimationCss(animationKeyframes, animation.duration)
    } else {
      return fadeIn(animation.duration)
    }
  }

  isItemToAnimate({ rules, type, index, displayIndex }: ItemContext<P, M, L>, animation: Animation<CreateItem<P, M, L>>): boolean {
    const item = rules.material(type).getItem(index)!
    if (animation.move.itemType !== type || lastCreatedItemsIndexes[JSON.stringify(animation.move)] !== index) return false
    const quantity = item.quantity ?? 1
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