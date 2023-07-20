import { ItemAnimations } from './ItemAnimations'
import { CreateItem } from '@gamepark/rules-api'
import { MaterialAnimationContext } from './MaterialGameAnimations'

export class ShuffleAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends ItemAnimations<P, M, L> {

  constructor(private duration = 1) {
    super()
  }

  override getPostDuration(_move: CreateItem<P, M, L>, _context: MaterialAnimationContext<P, M, L>): number {
    return this.duration
  }

  // TODO shuffle animation
}