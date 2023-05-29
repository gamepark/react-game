import { MaterialMoveType, MaterialRulesMove, MoveKind } from '@gamepark/rules-api'

export function isMoveItem<P extends number = number, M extends number = number, L extends number = number>(
  move: MaterialRulesMove<P, M, L>, itemType: M, itemIndex: number
): boolean {
  return move.kind === MoveKind.MaterialMove
    && move.itemType === itemType
    && (move.type === MaterialMoveType.Move || move.type === MaterialMoveType.Delete)
    && move.itemIndex === itemIndex
}