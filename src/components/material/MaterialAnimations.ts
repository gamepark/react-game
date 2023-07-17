import { Animation, AnimationContext, Animations } from '@gamepark/react-client'
import {
  Coordinates,
  CreateItem,
  DeleteItem,
  ItemMove,
  ItemMoveType,
  MaterialGame,
  MaterialItem,
  MaterialMove,
  MaterialRules,
  MoveItem
} from '@gamepark/rules-api'
import { css, Interpolation, Keyframes, keyframes, Theme } from '@emotion/react'
import { ItemContext, ItemLocator } from '../../locators'
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
    const stockTransforms = this.getFirstStockItemTransforms(context)
    if (stockTransforms) {
      const targetTransform = adjustRotation(stockTransforms, transformItem(context)).join(' ')
      const animationKeyframes = this.getKeyframesFromOrigin(targetTransform, animation, context)
      return movementAnimationCss(animationKeyframes, animation.duration)
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

  protected getFirstStockItemTransforms(context: ItemContext<P, M, L>): string[] {
    const { game, type, index, locators, material } = context
    const item = game.items[type]![index]
    const description = material[type]
    const stockLocation = description.getStockLocation(item, context)
    if (!stockLocation) return []
    const stockItem = description.getStaticItems(context).find(item => equal(item.location, stockLocation))
    const displayIndex = stockItem?.quantity ? stockItem.quantity - 1 : 0
    const stockLocator = locators[stockLocation.type]
    return stockLocator.transformItem(stockItem ?? { location: stockLocation }, { ...context, index: 0, displayIndex })
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
    const targetTransforms = targetLocator.transformItem(futureItem, futureContext)
    const targetTransform = adjustRotation(targetTransforms, transformItem(context)).join(' ')
    const animationKeyframes = this.getKeyframesToDestination(targetTransform, animation, context)
    return movementAnimationCss(animationKeyframes, animation.duration)
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
    const stockLocation = this.getFirstStockItemTransforms(context)
    if (stockLocation) {
      const targetTransform = adjustRotation(stockLocation, transformItem(context)).join(' ')
      const animationKeyframes = this.getKeyframesToDestination(targetTransform, animation, context)
      return movementAnimationCss(animationKeyframes, animation.duration)
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

const movementAnimationCss = (keyframes: Keyframes, duration: number) => css`
  animation: ${upAndDown} ${duration}s linear infinite;

  > * {
    animation: ${keyframes} ${duration}s ease-in-out forwards;
  }
`

const upAndDown = keyframes`
  from, to {
    transform: none;
  }
  50% {
    transform: translateZ(10em);
  }
`

function adjustRotation(targetTransforms: string[], sourceTransforms: string[]): string[] {
  const result: string[] = []
  const sourceRotation = sumRotationsDegrees(sourceTransforms)
  const targetRotation = sumRotationsDegrees(targetTransforms)
  for (const axis in sourceRotation) {
    const delta = Math.round((sourceRotation[axis] - targetRotation[axis]) / 360)
    if (delta) result.push(`rotate${axis.toUpperCase()}(${delta * 360}deg)`)
  }
  return targetTransforms.concat(result)
}

function sumRotationsDegrees(transforms: string[]): Coordinates {
  const rotations: Coordinates = { x: 0, y: 0, z: 0 }
  for (const transform of transforms) {
    const rotateMatch = transform.match(/rotate([^(]*)\((-?\d+.?\d*)([^)]*)\)/)
    if (rotateMatch) {
      const axis = rotateMatch[1].toLowerCase(), value = parseFloat(rotateMatch[2]), unit = rotateMatch[3]
      if (axis in rotations) {
        switch (unit) {
          case 'deg':
            rotations[axis] += value
            break
          case 'rad':
            rotations[axis] += value * 180 / Math.PI
            break
        }
      }
    }
  }
  return rotations
}

function transformItem<P extends number = number, M extends number = number, L extends number = number>(context: ItemContext<P, M, L>): string[] {
  const { game, type, index, locators } = context
  const currentItem: MaterialItem<P, L> = game.items[type]![index]
  const sourceLocator = locators[currentItem.location.type]
  return sourceLocator.transformItem(currentItem, context)
}