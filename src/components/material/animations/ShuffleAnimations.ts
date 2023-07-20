import { ItemAnimations } from './ItemAnimations'
import { CreateItem, ItemMove, MaterialGame } from '@gamepark/rules-api'
import { AnimationContext } from '@gamepark/react-client'

export class ShuffleAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends ItemAnimations<P, M, L> {

  constructor(private duration = 1) {
    super()
  }

  override getPostDuration(_move: CreateItem<P, M, L>, _context: AnimationContext<MaterialGame<P, M, L>, ItemMove<P, M, L>, P>): number {
    return this.duration
  }

  // TODO shuffle animation
}