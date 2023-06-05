import { ItemMoveType, Location, MaterialMove, MoveKind } from '@gamepark/rules-api'
import { isLocationSubset } from './IsLocationSubset'

export function isMoveToLocation<P extends number, M extends number, L extends number>(
  move: MaterialMove<P, M, L>, location: Location<P, L>
): boolean {
  return move.kind === MoveKind.ItemMove
    && move.type === ItemMoveType.Move
    && move.position.location !== undefined
    && isLocationSubset(move.position.location, location)
}
