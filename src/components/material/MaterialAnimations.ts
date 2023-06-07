import { Animation, AnimationContext, Animations } from '@gamepark/react-client'
import { CreateItem, DeleteItem, ItemMove, ItemMoveType, MaterialGame, MaterialItem, MaterialMove, MoveItem, RulesCreator } from '@gamepark/rules-api'
import { css, Interpolation, keyframes, Theme } from '@emotion/react'
import { ItemLocator } from '../../locators'
import { MaterialDescription } from './MaterialDescription'

export class MaterialAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends Animations<MaterialGame<P, M, L>, ItemMove<P, M, L>, P> {

  override getPreDuration(move: ItemMove<P, M, L>, context: AnimationContext<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P>): number {
    switch (move.type) {
      case ItemMoveType.Move:
      case ItemMoveType.Create:
      case ItemMoveType.Delete:
        return this.moveDuration(move, context)
      default:
        return 0
    }
  }

  moveDuration(_move: ItemMove<P, M, L>, _context: AnimationContext<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P>): number {
    return 1
  }

  getItemAnimation(item: MaterialItem<P, L>, animation: Animation<ItemMove<P, M, L>>, context: ItemAnimationContext<P, M, L>): Interpolation<Theme> {
    switch (animation.move.type) {
      case ItemMoveType.Create:
        return this.getCreateItemAnimation(item, animation as Animation<CreateItem<P, M, L>>, context)
      case ItemMoveType.Move:
        return this.getMoveItemAnimation(item, animation as Animation<MoveItem<P, M, L>>, context)
      case ItemMoveType.Delete:
        return this.getDeleteItemAnimation(item, animation as Animation<DeleteItem<M>>, context)
    }
  }

  protected getCreateItemAnimation(
    _item: MaterialItem<P, L>, _animation: Animation<CreateItem<P, M, L>>, _context: ItemAnimationContext<P, M, L>
  ): Interpolation<Theme> {
    // TODO: move from stock of fade in by default
    return
  }

  protected getMoveItemAnimation(
    item: MaterialItem<P, L>, animation: Animation<MoveItem<P, M, L>>, { Rules, game, ...context }: ItemAnimationContext<P, M, L>
  ): Interpolation<Theme> {
    const type = animation.move.itemType
    const rules = new Rules(JSON.parse(JSON.stringify(game)))
    rules.play(JSON.parse(JSON.stringify(animation.move)))
    const indexAfter = 0 // TODO: we need to now when we merge with an existing item where the item will go in terms of index
    const targetPosition = { ...item, ...animation.move.position }
    const targetLocator = context.locators[targetPosition.location.type]
    const animationKeyframes = keyframes`
      to {
        transform: ${targetLocator.place(targetPosition, { ...context, game: rules.game, type, index: indexAfter })};
      }
    `
    return css`animation: ${animationKeyframes} ${animation.duration}s ease-in-out`
  }

  protected getDeleteItemAnimation(
    _item: MaterialItem<P, L>, _animation: Animation<DeleteItem<M>>, _context: ItemAnimationContext<P, M, L>
  ): Interpolation<Theme> {
    // TODO: move to stock of fade out by default
    return
  }
}

export type ItemAnimationContext<P extends number = number, M extends number = number, L extends number = number> = {
  Rules: RulesCreator,
  material: Record<M, MaterialDescription<P, M, L>>
  locators: Record<L, ItemLocator<P, M, L>>
  game: MaterialGame<P, M, L>
  player?: P
  index: number
}
