import { Interpolation, Theme } from '@emotion/react'
import { Animation, Animations } from '@gamepark/react-client'
import { GridBoundaries, ItemMove, ItemMoveType, MaterialGame, MaterialMove, MaterialRules, MoveKind } from '@gamepark/rules-api'
import { ItemContext, Locator } from '../../../locators'
import { MaterialDescription } from '../MaterialDescription'
import { CreateItemAnimations } from './CreateItemAnimations'
import { CreateItemsAtOnceAnimations, defaultCreateAtOnceDuration } from './CreateItemsAtOnceAnimations'
import { DeleteItemAnimations } from './DeleteItemAnimations'
import { DeleteItemAtOnceAnimations } from './DeleteItemAtOnceAnimations'
import { ItemAnimations } from './ItemAnimations'
import { MaterialGameAnimationContext } from './MaterialGameAnimations'
import { MoveItemAnimations } from './MoveItemAnimations'
import { MoveItemAtOnceAnimations } from './MoveItemAtOnceAnimations'
import { RollItemAnimations } from './RollItemAnimations'
import { defaultShuffleDuration, ShuffleAnimations } from './ShuffleAnimations'
import { Trajectory } from './Trajectory'

export class MaterialAnimations<P extends number = number, M extends number = number, L extends number = number, R extends number = number, V extends number = number>
  extends Animations<MaterialGame<P, M, L, R, V>, MaterialMove<P, M, L, R, V>, P> {

  protected readonly animations: Partial<Record<ItemMoveType, ItemAnimations<P, M, L, R, V>>>

  constructor({
                duration = 1,
                droppedItemDuration = 0.2,
                trajectory,
                shuffleDuration = defaultShuffleDuration,
                createAtOnceDuration = defaultCreateAtOnceDuration
              }: MaterialAnimationsConfig<P, M, L> = {}) {
    super()
    this.animations = {
      [ItemMoveType.Create]: new CreateItemAnimations(duration, trajectory),
      [ItemMoveType.CreateAtOnce]: new CreateItemsAtOnceAnimations(createAtOnceDuration, trajectory),
      [ItemMoveType.Move]: new MoveItemAnimations(duration, droppedItemDuration, trajectory),
      [ItemMoveType.MoveAtOnce]: new MoveItemAtOnceAnimations(duration, trajectory),
      [ItemMoveType.Delete]: new DeleteItemAnimations(duration, droppedItemDuration, trajectory),
      [ItemMoveType.DeleteAtOnce]: new DeleteItemAtOnceAnimations(duration, trajectory),
      [ItemMoveType.Shuffle]: new ShuffleAnimations(shuffleDuration),
      [ItemMoveType.Roll]: new RollItemAnimations(duration)
    }
  }

  getDuration(move: ItemMove<P, M, L>, context: MaterialGameAnimationContext<P, M, L, R, V>): number {
    return this.animations[move.type]?.getDuration(move, context) ?? 0
  }

  getItemAnimation(context: ItemContext<P, M, L, R, V>, animation: Animation<MaterialMove<P, M, L, R, V>>, boundaries: GridBoundaries): Interpolation<Theme> {
    if (animation.move.kind !== MoveKind.ItemMove) return
    return this.animations[animation.move.type]?.getItemAnimation(context, animation, boundaries)
  }
}

/**
 * What a {@link MaterialAnimations} is made of: four durations, all in seconds, and the trajectory
 * the items follow. Named rather than passed in a row, because a list of durations is a list in which only
 * the order tells a shuffle from a drop — and because every new one added would have to be threaded through
 * the call sites that do not care about it.
 */
export type MaterialAnimationsConfig<P extends number = number, M extends number = number, L extends number = number> = {
  /** How long an item takes to reach the place a move sends it to. Defaults to a second. */
  duration?: number
  /**
   * How long an item the player has dropped themselves takes to settle. Much shorter than the rest: the item
   * is already where the hand left it, and all that is left to animate is the snap onto its place.
   */
  droppedItemDuration?: number
  /** The path items follow rather than the straight line: its arc, its waypoints, its easing. */
  trajectory?: Trajectory<P, M, L>
  /**
   * How long a shuffle lasts. Not a displacement from A to B: it needs to last long enough for the random
   * movement to read as "the items were mixed up", hence a default of its own rather than {@link duration}.
   */
  shuffleDuration?: number
  /**
   * How long items created together fly for. Creating items at once is what a game does to lay out a whole
   * setup in one small payload, so it animates nothing by default (see {@link defaultCreateAtOnceDuration}):
   * a game that wants those creations seen asks for it, on the moves it wants it on.
   */
  createAtOnceDuration?: number
}

export type ItemAnimationContext<P extends number = number, M extends number = number, L extends number = number, R extends number = number, V extends number = number> = {
  material: Record<M, MaterialDescription<P, M, L, any, R, V>>
  locators: Record<L, Locator<P, M, L, R, V>>
  rules: MaterialRules<P, M, L, R, V>
  player?: P
}
