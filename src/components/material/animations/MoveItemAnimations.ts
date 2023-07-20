import { ItemAnimations } from './ItemAnimations'
import { ItemMove, MaterialGame, MaterialItem, MoveItem } from '@gamepark/rules-api'
import { Animation, AnimationContext } from '@gamepark/react-client'
import { ItemContext } from '../../../locators'
import { Interpolation, keyframes, Theme } from '@emotion/react'
import { adjustRotation } from './adjustRotation'
import { transformItem } from './transformItem.util'
import { movementAnimationCss } from './itemMovementCss.util'
import { isMovedOrDeletedItem } from './isMovedOrDeletedItem.util'
import { isPlacedOnItem } from '../utils/isPlacedOnItem'
import { getItemFromContext } from '../utils/getItemFromContext'

export class MoveItemAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends ItemAnimations<P, M, L> {

  constructor(protected duration = 1, protected droppedItemDuration = 0.2) {
    super()
  }

  override getPreDuration(move: MoveItem<P, M, L>, context: AnimationContext<MaterialGame<P, M, L>, ItemMove<P, M, L>, P>): number {
    if (context.state.droppedItem?.type === move.itemType && context.state.droppedItem?.index === move.itemIndex) {
      return this.droppedItemDuration
    }
    return this.duration
  }

  getItemAnimation(context: ItemContext<P, M, L>, animation: Animation<MoveItem<P, M, L>>): Interpolation<Theme> {
    if (isMovedOrDeletedItem(context, animation.move)) {
      return this.getMovedItemAnimation(context, animation)
    }
    const item = getItemFromContext(context)
    if (isPlacedOnItem(item, { type: animation.move.itemType, index: animation.move.itemIndex }, context)) {
      return this.getChildItemAnimation(item, context, animation)
    }
  }

  getMovedItemAnimation(context: ItemContext<P, M, L>, animation: Animation<MoveItem<P, M, L>>): Interpolation<Theme> {
    const { type, game, Rules, locators } = context
    const futureGame = JSON.parse(JSON.stringify(game))
    const rules = new Rules(futureGame)
    const mutator = rules.mutator(type)
    const futureIndex = mutator.move(animation.move)
    const futureItem = mutator.items[futureIndex]
    // TODO: if animation.move.quantity > 1, we will have to give a different target to each moving item. Formula bellow works only if 1 item moves
    const futureDisplayIndex = (futureItem.quantity ?? 1) - (animation.move.quantity ?? 1)
    const targetLocator = locators[futureItem.location.type]
    const futureContext = { ...context, game: futureGame, type, index: futureIndex, displayIndex: futureDisplayIndex }
    const targetTransforms = targetLocator.transformItem(futureItem, futureContext)
    const targetTransform = adjustRotation(targetTransforms, transformItem(context)).join(' ')
    const animationKeyframes = this.getKeyframesToDestination(targetTransform, animation, context)
    return movementAnimationCss(animationKeyframes, animation.duration)
  }

  getChildItemAnimation(item: MaterialItem<P, L>, context: ItemContext<P, M, L>, animation: Animation<MoveItem<P, M, L>>): Interpolation<Theme> {
    const { game, Rules, locators } = context
    const futureGame = JSON.parse(JSON.stringify(game))
    const rules = new Rules(futureGame)
    rules.play(animation.move)
    const targetLocator = locators[item.location.type]
    const futureContext = { ...context, game: futureGame }
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
