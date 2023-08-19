import { AnimationContext, Animations } from '@gamepark/react-client'
import { MaterialGame, MaterialMove, MoveKind } from '@gamepark/rules-api'
import { MaterialAnimations } from './MaterialAnimations'
import { GameContext } from '../../GameProvider'

export type MaterialAnimationContext<P extends number = number, M extends number = number, L extends number = number> =
  AnimationContext<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P>
  & Omit<GameContext<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P, M, L>, 'game'>

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

  override getDuration(move: MaterialMove<P, M, L>, context: MaterialAnimationContext<P, M, L>): number {
    if (move.kind !== MoveKind.ItemMove) return 0
    return this.getMaterialAnimations(move.itemType).getDuration(move, context)
  }
}