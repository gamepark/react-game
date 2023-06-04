import { Location, MaterialMoveType, MaterialRulesMove, MoveKind } from '@gamepark/rules-api'
import { isLocationSubset } from './IsLocationSubset'

export function isMoveToLocation<P extends number, M extends number, L extends number>(
  move: MaterialRulesMove<P, M, L>, location: Location<P, L>
): boolean {
  return move.kind === MoveKind.MaterialMove
    && move.type === MaterialMoveType.Move
    && move.position.location !== undefined
    && isLocationSubset(move.position.location, location)
}


