import { Location, MaterialMove } from '@gamepark/rules-api'
import { isMoveThisItem } from './IsMoveThisItem'
import { isMoveToLocation } from './IsMoveToLocation'
import { StockDescription } from '../MaterialDescription'
import { isMoveToStock } from './IsMoveToStock'

export const isMoveThisItemToLocation = <P extends number = number, M extends number = number, L extends number = number>(
  move: MaterialMove<P, M, L>, itemType: M, itemIndex: number, location: Location<P, L>, stocks?: Record<M, StockDescription<P, L> | undefined>
): boolean => {
  return isMoveThisItem(move, itemType, itemIndex) && (isMoveToLocation(move, location) || (!!stocks && isMoveToStock(stocks, move, location)))
}
