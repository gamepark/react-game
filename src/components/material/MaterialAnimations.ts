import { Animation, AnimationContext, Animations } from '@gamepark/react-client'
import {
  CreateItem,
  DeleteItem,
  DisplayedItem,
  ItemMove,
  ItemMoveType,
  MaterialGame,
  MaterialMove,
  MaterialMutator,
  MaterialRules,
  MoveItem
} from '@gamepark/rules-api'
import { css, Interpolation, keyframes, Theme } from '@emotion/react'
import { ItemLocator } from '../../locators'
import { MaterialDescription } from './MaterialDescription'
import equal from 'fast-deep-equal'

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

  getItemAnimation(item: DisplayedItem<M>, animation: Animation<ItemMove<P, M, L>>, context: ItemAnimationContext<P, M, L>): Interpolation<Theme> {
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
    item: DisplayedItem<M>, animation: Animation<CreateItem<P, M, L>>, context: ItemAnimationContext<P, M, L>
  ): Interpolation<Theme> {
    const stockLocation = this.getStockLocation(item.type, animation.move.item.id, context)
    if (stockLocation) {
      const origin = this.closestItemRotation(stockLocation, item, context)
      const animationKeyframes = this.getKeyframesFromOrigin(origin, item, animation, context)
      return css`animation: ${animationKeyframes} ${animation.duration}s ease-in-out forwards`
    } else {
      return this.fadein(animation.duration)
    }
  }

  protected fadein(duration: number) {
    const fadein = keyframes`
      from {
        opacity: 0;
      }
    `
    return css`animation: ${fadein} ${duration}s ease-in-out forwards`
  }

  protected getStockLocation(itemType: M, itemId: any, animationContext: ItemAnimationContext<P, M, L>) {
    const { rules, ...context } = animationContext
    const type = itemType
    const stock = this.getMatchingStock(itemType, itemId, animationContext)
    if (!stock) return
    const stockItem = context.material[type].getItems(rules.game, context.player).find(i => {
      const { quantity, ...item } = i
      return equal(item, stock)
    })
    const index = stockItem?.quantity ? stockItem.quantity - 1 : 0
    const stockLocator = context.locators[stock.location.type]
    return stockLocator.transformItem(stockItem ?? stock, { ...context, game: rules.game, type, index: 0, displayIndex: index }).join(' ')
  }

  protected getMatchingStock(itemType: M, itemId: any, context: ItemAnimationContext<P, M, L>) {
    const { rules } = context
    const materialDescription = context.material[itemType]
    return materialDescription.getStocks({ ...context, game: rules.game }).find(stock => equal(stock.id, itemId))
  }

  protected getKeyframesFromOrigin(
    origin: string, _item: DisplayedItem<M>, _animation: Animation<ItemMove<P, M, L>>, _context: ItemAnimationContext<P, M, L>
  ) {
    return keyframes`
      from {
        transform: ${origin};
      }
    `
  }

  protected getMoveItemAnimation(
    item: DisplayedItem<M>, animation: Animation<MoveItem<P, M, L>>, context: ItemAnimationContext<P, M, L>
  ): Interpolation<Theme> {
    const rules = context.rules
    const type = item.type
    const gameCopy = JSON.parse(JSON.stringify(rules.game))
    const mutator = new MaterialMutator<P, M, L>(type, gameCopy.items[type] ?? [], rules.locationsStrategies[type])
    const futureIndex = mutator.move(animation.move)
    const futureItem = mutator.items[futureIndex]
    // TODO: if animation.move.quantity > 1, we will have to give a different target to each moving item. Formula bellow works only if 1 item moves
    const indexAfter = (futureItem.quantity ?? 1) - (animation.move.quantity ?? 1)
    const targetLocator = context.locators[futureItem.location.type]
    const targetTransform = targetLocator.transformItem(futureItem, {
      ...context,
      game: gameCopy,
      type,
      index: futureIndex,
      displayIndex: indexAfter
    }).join(' ')
    const destination = this.closestItemRotation(targetTransform, item, context)
    const animationKeyframes = this.getKeyframesToDestination(destination, item, animation, context)
    return css`animation: ${animationKeyframes} ${animation.duration}s ease-in-out forwards`
  }

  private closestItemRotation(transform: string, item: DisplayedItem<M>, context: ItemAnimationContext<P, M, L>): string {
    return this.closestRotation(transform, this.transformItem(item, context))
  }

  private transformItem(item: DisplayedItem<M>, { rules: { game }, ...context }: ItemAnimationContext<P, M, L>): string {
    const type = item.type
    const currentItem = game.items[type]![item.index]
    const sourceLocator = context.locators[currentItem.location.type]
    return sourceLocator.transformItem(currentItem, { ...context, game, ...item }).join(' ')
  }

  private closestRotation(targetTransform: string, sourceTransform: string): string {
    const sourceRotation = this.getRotation(sourceTransform)
    const targetRotation = this.getRotation(targetTransform)
    const rotationAdjustment = Math.round((sourceRotation - targetRotation) / 360) * 360
    return rotationAdjustment ? targetTransform + ` rotateZ(${rotationAdjustment}deg)` : targetTransform
  }

  private getRotation(transform: string): number {
    return Array.from(transform.matchAll(/rotateZ\((\d+.?\d*)deg\)/gi)).reduce((sum, match) => sum + parseFloat(match[1]), 0)
      + Array.from(transform.matchAll(/rotateZ\((\d+.?\d*)rad\)/gi)).reduce((sum, match) => sum + parseFloat(match[1]) * 180 / Math.PI, 0)
  }

  protected getKeyframesToDestination(
    destination: string, _item: DisplayedItem<M>, _animation: Animation<ItemMove<P, M, L>>, _context: ItemAnimationContext<P, M, L>
  ) {
    return keyframes`
      to {
        transform: ${destination};
      }
    `
  }

  protected getDeleteItemAnimation(
    item: DisplayedItem<M>, animation: Animation<DeleteItem<M>>, context: ItemAnimationContext<P, M, L>
  ): Interpolation<Theme> {
    const materialItem = context.rules.material(animation.move.itemType).getItem(animation.move.itemIndex)
    const stockLocation = this.getStockLocation(animation.move.itemType, materialItem!.id, context)
    if (stockLocation) {
      const destination = this.closestItemRotation(stockLocation, item, context)
      const animationKeyframes = this.getKeyframesToDestination(destination, item, animation, context)
      return css`animation: ${animationKeyframes} ${animation.duration}s ease-in-out forwards`
    } else {
      const fadeout = keyframes`
        to {
          opacity: 0;
        }
      `
      return css`animation: ${fadeout} ${animation.duration}s ease-in-out forwards`
    }
  }
}

export type ItemAnimationContext<P extends number = number, M extends number = number, L extends number = number> = {
  material: Record<M, MaterialDescription<P, M, L>>
  locators: Record<L, ItemLocator<P, M, L>>
  rules: MaterialRules<P, M, L>
  player?: P
}
