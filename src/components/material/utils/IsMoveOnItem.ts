import { MaterialMoveType, MaterialRulesMove, MoveKind } from '@gamepark/rules-api'

export function isMoveOnItem<P extends number = number, M extends number = number, L extends number = number>(
  move: MaterialRulesMove<P, M, L>, itemIndex: number | undefined, itemInnerLocationTypes: L[]
): boolean {
  return move.kind === MoveKind.MaterialMove
    && move.type === MaterialMoveType.Move
    && move.position.location !== undefined
    && itemInnerLocationTypes.includes(move.position.location.type)
    && move.position.location.parent === itemIndex
}