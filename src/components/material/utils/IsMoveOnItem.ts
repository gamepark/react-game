import { ItemMoveType, MaterialMove, MoveKind } from '@gamepark/rules-api'

export function isMoveOnItem<P extends number = number, M extends number = number, L extends number = number>(
  move: MaterialMove<P, M, L>, itemIndex: number | undefined, itemInnerLocationTypes: L[]
): boolean {
  return move.kind === MoveKind.ItemMove
    && move.type === ItemMoveType.Move
    && itemInnerLocationTypes.includes(move.location.type)
    && move.location.parent === itemIndex
}
