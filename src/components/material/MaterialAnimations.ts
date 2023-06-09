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

  getPostDuration(move: ItemMove<P, M, L>, context: AnimationContext<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P>): number {
    switch (move.type) {
      case ItemMoveType.Create:
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
    item: MaterialItem<P, L>, animation: Animation<CreateItem<P, M, L>>, context: ItemAnimationContext<P, M, L>
  ): Interpolation<Theme> {
    const origin = this.getStockLocation(animation.move.itemType, context)
    if (origin) {
      const animationKeyframes = this.getKeyframesFromOrigin(origin, item, animation, context)
      return css`animation: ${animationKeyframes} ${animation.duration}s ease-in-out`
    } else {
      const fadein = keyframes`
        from {
          opacity: 0;
        }
      `
      return css`animation: ${fadein} ${animation.duration}s ease-in-out`
    }
  }

  protected getStockLocation(itemType: M, { rules, ...context }: ItemAnimationContext<P, M, L>) {
    const type = itemType
    const stock = context.material[type].stock
    if (!stock) return
    const stockItem = context.material[type].items?.(rules.game, context.player).find(item => item.location.type === stock.location.type)
    const index = stockItem?.quantity ? stockItem.quantity - 1 : 0
    const stockLocator = context.locators[stock.location.type]
    return stockLocator.place(stockItem ?? stock, { ...context, game: rules.game, type, index })
  }

  protected getKeyframesFromOrigin(
    origin: string, _item: MaterialItem<P, L>, _animation: Animation<ItemMove<P, M, L>>, _context: ItemAnimationContext<P, M, L>
  ) {
    return keyframes`
      from {
        transform: ${origin};
      }
    `
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
    const animationKeyframes = this.getKeyframesToDestination(destination, item, animation, { rules, ...context })
    return css`animation: ${animationKeyframes} ${animation.duration}s ease-in-out`
  }

  protected getKeyframesToDestination(
    destination: string, _item: MaterialItem<P, L>, _animation: Animation<ItemMove<P, M, L>>, _context: ItemAnimationContext<P, M, L>
  ) {
    return keyframes`
      to {
        transform: ${destination};
      }
    `
  }

  protected getDeleteItemAnimation(
    item: MaterialItem<P, L>, animation: Animation<DeleteItem<M>>, context: ItemAnimationContext<P, M, L>
  ): Interpolation<Theme> {
    const destination = this.getStockLocation(animation.move.itemType, context)
    if (destination) {
      const animationKeyframes = this.getKeyframesToDestination(destination, item, animation, context)
      return css`animation: ${animationKeyframes} ${animation.duration}s ease-in-out`
    } else {
      const fadeout = keyframes`
        to {
          opacity: 0;
        }
      `
      return css`animation: ${fadeout} ${animation.duration}s ease-in-out`
    }
  }
}

export type ItemAnimationContext<P extends number = number, M extends number = number, L extends number = number> = {
  material: Record<M, MaterialDescription<P, M, L>>
  locators: Record<L, ItemLocator<P, M, L>>
  rules: MaterialRules<P, M, L>
  player?: P
}
