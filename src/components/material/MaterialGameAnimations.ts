import { AnimationContext, Animations } from '@gamepark/react-client'
import { MaterialGame, MaterialMove, MoveKind } from '@gamepark/rules-api'
import { MaterialAnimations } from './MaterialAnimations'

export class MaterialGameAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends Animations<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P> {

  readonly itemsAnimations: Partial<Record<M, MaterialAnimations<P, M, L>>>

  constructor(itemsAnimations: Partial<Record<M, MaterialAnimations<P, M, L>>> = {}) {
    super()
    this.itemsAnimations = itemsAnimations
  }

  getMaterialAnimations(materialType: M): MaterialAnimations<P, M, L> {
    return this.itemsAnimations[materialType] ?? new MaterialAnimations()
  }

  override getPreDuration(move: MaterialMove<P, M, L>, context: AnimationContext<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P>): number {
    if (move.kind !== MoveKind.ItemMove) return 0
    return this.getMaterialAnimations(move.itemType).getPreDuration(move, context)
  }
}