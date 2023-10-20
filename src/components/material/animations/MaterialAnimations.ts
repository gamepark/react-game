import { Interpolation, Theme } from '@emotion/react'
import { Animation, Animations } from '@gamepark/react-client'
import { ItemMove, ItemMoveType, MaterialGame, MaterialMove, MaterialRules, MoveKind } from '@gamepark/rules-api'
import { ItemContext, ItemLocator } from '../../../locators'
import { MaterialDescription } from '../MaterialDescription'
import { CreateItemAnimations } from './CreateItemAnimations'
import { DeleteItemAnimations } from './DeleteItemAnimations'
import { ItemAnimations } from './ItemAnimations'
import { MaterialAnimationContext } from './MaterialGameAnimations'
import { MoveItemAnimations } from './MoveItemAnimations'
import { ShuffleAnimations } from './ShuffleAnimations'

export class MaterialAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends Animations<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P> {

  protected readonly animations: Record<ItemMoveType, ItemAnimations<P, M, L>>

  constructor(duration = 1, droppedItemDuration = 0.2) {
    super()
    this.animations = {
      [ItemMoveType.Create]: new CreateItemAnimations(duration),
      [ItemMoveType.Move]: new MoveItemAnimations(duration, droppedItemDuration),
      [ItemMoveType.Delete]: new DeleteItemAnimations(duration, droppedItemDuration),
      [ItemMoveType.Shuffle]: new ShuffleAnimations(0),
      [ItemMoveType.Roll]: new ShuffleAnimations(0) // TODO RollAnimations
    }
  }

  getDuration(move: ItemMove<P, M, L>, context: MaterialAnimationContext<P, M, L>): number {
    return this.animations[move.type].getDuration(move, context)
  }

  getItemAnimation(context: ItemContext<P, M, L>, animation: Animation<MaterialMove<P, M, L>>): Interpolation<Theme> {
    if (animation.move.kind !== MoveKind.ItemMove) return
    return this.animations[animation.move.type].getItemAnimation(context, animation)
  }
}

export type ItemAnimationContext<P extends number = number, M extends number = number, L extends number = number> = {
  material: Record<M, MaterialDescription<P, M, L>>
  locators: Record<L, ItemLocator<P, M, L>>
  rules: MaterialRules<P, M, L>
  player?: P
}
