import { Animation, AnimationContext, Animations } from '@gamepark/react-client'
import {
  CreateItem,
  DeleteItem,
  ItemMove,
  ItemMoveType,
  MaterialGame,
  MaterialItem,
  MaterialMove,
  MaterialMutator,
  MaterialRules,
  MoveItem
} from '@gamepark/rules-api'
import { css, Interpolation, keyframes, Theme } from '@emotion/react'
import { ItemLocator } from '../../locators'
import { MaterialDescription } from './MaterialDescription'

export class MaterialAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends Animations<MaterialGame<P, M, L>, ItemMove<P, M, L>, P> {

  override getPreDuration(move: ItemMove<P, M, L>, context: AnimationContext<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P>): number {
    switch (move.type) {
      case ItemMoveType.Create:
        return this.moveDuration(move, context)
      case ItemMoveType.Move:
      case ItemMoveType.Delete:
        if (context.state.droppedItem?.type === move.itemType && context.state.droppedItem?.index === move.itemIndex) {
          return 0.2
        }
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
    item: MaterialItem<P, L>, animation: Animation<MoveItem<P, M, L>>, { rules, ...context }: ItemAnimationContext<P, M, L>
  ): Interpolation<Theme> {
    const type = animation.move.itemType
    const gameCopy = JSON.parse(JSON.stringify(rules.game))
    const mutator = new MaterialMutator<P, M, L>(type, gameCopy.items[type] ?? [], rules.getLocationsStrategies()[type])
    const futureIndex = mutator.move(animation.move)
    const futureItem = mutator.items[futureIndex]
    // TODO: if animation.move.quantity > 1, we will have to give a different target to each moving item. Formula bellow works only if 1 item moves
    const indexAfter = (futureItem.quantity ?? 1) - (animation.move.quantity ?? 1)
    const targetLocator = context.locators[futureItem.location.type]
    const destination = targetLocator.place(futureItem, { ...context, game: gameCopy, type, index: indexAfter })
    const animationKeyframes = this.getAnimationKeyframes(destination, item, animation, { rules, ...context })
    return css`animation: ${animationKeyframes} ${animation.duration}s ease-in-out`
  }

  protected getAnimationKeyframes(
    destination: string, _item: MaterialItem<P, L>, _animation: Animation<ItemMove<P, M, L>>, _context: ItemAnimationContext<P, M, L>
  ) {
    return keyframes`
      to {
        transform: ${destination};
      }
    `
  }

  protected getDeleteItemAnimation(
    _item: MaterialItem<P, L>, _animation: Animation<DeleteItem<M>>, _context: ItemAnimationContext<P, M, L>
  ): Interpolation<Theme> {
    // TODO: move to stock of fade out by default
    return
  }
}

export type ItemAnimationContext<P extends number = number, M extends number = number, L extends number = number> = {
  material: Record<M, MaterialDescription<P, M, L>>
  locators: Record<L, ItemLocator<P, M, L>>
  rules: MaterialRules<P, M, L>
  player?: P
}
