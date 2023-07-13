import { Animation, AnimationContext, Animations } from '@gamepark/react-client'
import { CreateItem, DeleteItem, ItemMove, ItemMoveType, MaterialGame, MaterialMove, MaterialRules, MoveItem } from '@gamepark/rules-api'
import { css, Interpolation, keyframes, Theme } from '@emotion/react'
import { ItemContext, ItemLocator } from '../../locators'
import { MaterialDescription } from './MaterialDescription'
import equal from 'fast-deep-equal'
import sumBy from 'lodash/sumBy'

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

  getItemAnimation(context: ItemContext<P, M, L>, animation: Animation<ItemMove<P, M, L>>): Interpolation<Theme> {
    switch (animation.move.type) {
      case ItemMoveType.Create:
        return this.getCreateItemAnimation(context, animation as Animation<CreateItem<P, M, L>>)
      case ItemMoveType.Move:
        return this.getMoveItemAnimation(context, animation as Animation<MoveItem<P, M, L>>)
      case ItemMoveType.Delete:
        return this.getDeleteItemAnimation(context, animation as Animation<DeleteItem<M>>)
    }
  }

  protected getCreateItemAnimation(context: ItemContext<P, M, L>, animation: Animation<CreateItem<P, M, L>>): Interpolation<Theme> {
    const stockLocation = this.getStockLocation(context)
    if (stockLocation) {
      const origin = this.closestItemRotation(stockLocation, context)
      const animationKeyframes = this.getKeyframesFromOrigin(origin, animation, context)
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

  protected getStockLocation(context: ItemContext<P, M, L>) {
    const { game, type, index, locators, material } = context
    const item = game.items[type]![index]
    const description = material[type]
    const stockLocation = description.getStockLocation(item, context)
    if (!stockLocation) return
    const stockItem = description.getStaticItems(context).find(item => equal(item.location, stockLocation))
    const displayIndex = stockItem?.quantity ? stockItem.quantity - 1 : 0
    const stockLocator = locators[stockLocation.type]
    return stockLocator.transformItem(stockItem ?? { location: stockLocation }, { ...context, index: 0, displayIndex }).join(' ')
  }

  protected getKeyframesFromOrigin(origin: string, _animation: Animation<ItemMove<P, M, L>>, _context: ItemContext<P, M, L>) {
    return keyframes`
      from {
        transform: ${origin};
      }
    `
  }

  protected getMoveItemAnimation(context: ItemContext<P, M, L>, animation: Animation<MoveItem<P, M, L>>): Interpolation<Theme> {
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
    const targetTransform = targetLocator.transformItem(futureItem, futureContext).join(' ')
    const destination = this.closestItemRotation(targetTransform, context)
    const animationKeyframes = this.getKeyframesToDestination(destination, animation, context)
    return css`animation: ${animationKeyframes} ${animation.duration}s ease-in-out forwards`
  }

  private closestItemRotation(transform: string, context: ItemContext<P, M, L>): string {
    return this.closestRotation(transform, this.transformItem(context))
  }

  private transformItem(context: ItemContext<P, M, L>): string {
    const { game, type, index, locators } = context
    const currentItem = game.items[type]![index]
    const sourceLocator = locators[currentItem.location.type]
    return sourceLocator.transformItem(currentItem, context).join(' ')
  }

  private closestRotation(targetTransform: string, sourceTransform: string): string {
    const sourceRotation = this.getRotation(sourceTransform)
    const targetRotation = this.getRotation(targetTransform)
    const rotationAdjustment = Math.round((sourceRotation - targetRotation) / 360) * 360
    return rotationAdjustment ? targetTransform + ` rotateZ(${rotationAdjustment}deg)` : targetTransform
  }

  private getRotation(transform: string): number {
    return sumBy(Array.from(transform.matchAll(/rotateZ\((\d+.?\d*)deg\)/gi)), match => parseFloat(match[1]))
      + sumBy(Array.from(transform.matchAll(/rotateZ\((\d+.?\d*)rad\)/gi)), match => parseFloat(match[1]) * 180 / Math.PI)
  }

  protected getKeyframesToDestination(
    destination: string, _animation: Animation<ItemMove<P, M, L>>, _context: ItemContext<P, M, L>
  ) {
    return keyframes`
      to {
        transform: ${destination};
      }
    `
  }

  protected getDeleteItemAnimation(context: ItemContext<P, M, L>, animation: Animation<DeleteItem<M>>): Interpolation<Theme> {
    const stockLocation = this.getStockLocation(context)
    if (stockLocation) {
      const destination = this.closestItemRotation(stockLocation, context)
      const animationKeyframes = this.getKeyframesToDestination(destination, animation, context)
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
