import { CreateItem } from '@gamepark/rules-api'
import { ItemAnimations } from './ItemAnimations'
import { MaterialGameAnimationContext } from './MaterialGameAnimations'

export class ShuffleAnimations<P extends number = number, M extends number = number, L extends number = number, R extends number = number, V extends number = number>
  extends ItemAnimations<P, M, L, R, V> {

  constructor(private duration = 1) {
    super()
  }

  override getPostDuration(_move: CreateItem<P, M, L>, _context: MaterialGameAnimationContext<P, M, L, R, V>): number {
    return this.duration
  }

  // TODO shuffle animation
}