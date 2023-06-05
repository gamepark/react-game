import { ItemMoveType, MaterialMove, MoveKind } from '@gamepark/rules-api'

export function isMoveThisItem<P extends number = number, M extends number = number, L extends number = number>(
  move: MaterialMove<P, M, L>, itemType: M, itemIndex: number
): boolean {
  return move.kind === MoveKind.ItemMove
    && move.itemType === itemType
    && (move.type === ItemMoveType.Move || move.type === ItemMoveType.Delete)
    && move.itemIndex === itemIndex
}