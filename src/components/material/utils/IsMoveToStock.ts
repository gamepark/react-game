import { isDeleteItem, Location, MaterialMove } from '@gamepark/rules-api'
import { StockDescription } from '../MaterialDescription'

export const isMoveToStock = <P extends number, M extends number, L extends number>(
  stocks: Record<M, StockDescription<P, L>[]>, move: MaterialMove<P, M, L>, location: Location<P, L>
): boolean => {
  return isDeleteItem(move) && stocks[move.itemType].some(stock => stock.location.type === location.type)
}

