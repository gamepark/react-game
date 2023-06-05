import { Location, MaterialMove } from '@gamepark/rules-api'
import { isMoveItem } from './IsMoveItem'
import { isMoveToLocation } from './IsMoveToLocation'

export const isMoveItemToLocation = <P extends number = number, M extends number = number, L extends number = number>(
  move: MaterialMove<P, M, L>, itemType: M, itemIndex: number, location: Location<P, L>
): boolean => {
  return isMoveItem(move, itemType, itemIndex) && isMoveToLocation(move, location)
}
