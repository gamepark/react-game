import { Interpolation, Theme } from '@emotion/react'
import { Animation, Animations } from '@gamepark/react-client'
import { GridBoundaries, ItemMove, ItemMoveType, MaterialGame, MaterialMove, MaterialRules, MoveKind } from '@gamepark/rules-api'
import { ItemContext, Locator } from '../../../locators'
import { MaterialDescription } from '../MaterialDescription'
import { CreateItemAnimations } from './CreateItemAnimations'
import { DeleteItemAnimations } from './DeleteItemAnimations'
import { DeleteItemAtOnceAnimations } from './DeleteItemAtOnceAnimations'
import { ItemAnimations } from './ItemAnimations'
import { MaterialGameAnimationContext } from './MaterialGameAnimations'
import { MoveItemAnimations } from './MoveItemAnimations'
import { MoveItemAtOnceAnimations } from './MoveItemAtOnceAnimations'
import { RollItemAnimations } from './RollItemAnimations'
import { ShuffleAnimations } from './ShuffleAnimations'
import { Trajectory } from './Trajectory'

export class MaterialAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends Animations<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P> {

  protected readonly animations: Partial<Record<ItemMoveType, ItemAnimations<P, M, L>>>

  constructor(duration = 1, droppedItemDuration = 0.2, trajectory?: Trajectory<P, M, L>) {
    super()
    this.animations = {
      [ItemMoveType.Create]: new CreateItemAnimations(duration, trajectory),
      [ItemMoveType.Move]: new MoveItemAnimations(duration, droppedItemDuration, trajectory),
      [ItemMoveType.MoveAtOnce]: new MoveItemAtOnceAnimations(duration, trajectory),
      [ItemMoveType.Delete]: new DeleteItemAnimations(duration, droppedItemDuration, trajectory),
      [ItemMoveType.DeleteAtOnce]: new DeleteItemAtOnceAnimations(duration, trajectory),
      [ItemMoveType.Shuffle]: new ShuffleAnimations(0),
      [ItemMoveType.Roll]: new RollItemAnimations(duration)
    }
  }

  getDuration(move: ItemMove<P, M, L>, context: MaterialGameAnimationContext<P, M, L>): number {
    return this.animations[move.type]?.getDuration(move, context) ?? 0
  }

  getItemAnimation(context: ItemContext<P, M, L>, animation: Animation<MaterialMove<P, M, L>>, boundaries: GridBoundaries): Interpolation<Theme> {
    if (animation.move.kind !== MoveKind.ItemMove) return
    return this.animations[animation.move.type]?.getItemAnimation(context, animation, boundaries)
  }
}

export type ItemAnimationContext<P extends number = number, M extends number = number, L extends number = number> = {
  material: Record<M, MaterialDescription<P, M, L>>
  locators: Record<L, Locator<P, M, L>>
  rules: MaterialRules<P, M, L>
  player?: P
}
