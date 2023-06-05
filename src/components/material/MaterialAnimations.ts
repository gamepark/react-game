import { AnimationContext, Animations } from '@gamepark/react-client'
import { ItemMove, ItemMoveType, MaterialGame, MaterialMove, MaterialMutator, MoveKind } from '@gamepark/rules-api'

export class MaterialAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends Animations<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P> {

  willMerge(move: ItemMove<P, M, L>, game: MaterialGame<P, M, L>): boolean {
    switch (move.type) {
      case ItemMoveType.Move:
        const mutator = new MaterialMutator(move.itemType, game.items[move.itemType] ?? [])
        return mutator.findMergeItem(mutator.getItemAfterMove(move)) !== undefined
      default:
        return false
    }
  }

  willSplit(move: ItemMove<P, M, L>, game: MaterialGame<P, M, L>): boolean {
    switch (move.type) {
      case ItemMoveType.Move:
      case ItemMoveType.Delete:
        const item = game.items[move.itemType]![move.itemIndex]!
        return item.quantity !== undefined && item.quantity > (move.quantity ?? 1)
      default:
        return false
    }
  }

  override getPreDuration(move: MaterialMove<P, M, L>, context: AnimationContext<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P>): number {
    if (move.kind !== MoveKind.ItemMove) return 0
    switch (move.type) {
      case ItemMoveType.Move:
        return this.willMerge(move, context.state) || this.willSplit(move, context.state) ? this.moveDuration(move, context) : 0
      case ItemMoveType.Create:
        return this.moveDuration(move, context)
      case ItemMoveType.Delete:
        return this.moveDuration(move, context)
      default:
        return 0
    }
  }

  override getPostDuration(move: MaterialMove<P, M, L>, context: AnimationContext<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P>): number {
    if (move.kind !== MoveKind.ItemMove) return 0
    switch (move.type) {
      case ItemMoveType.Move:
        return this.willMerge(move, context.state) || this.willSplit(move, context.state) ? 0 : this.moveDuration(move, context)
      default:
        return 0
    }
  }

  moveDuration(_move: ItemMove<P, M, L>, _context: AnimationContext<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P>): number {
    return 1
  }
}