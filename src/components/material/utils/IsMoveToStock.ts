import { ItemMoveType, Location, MaterialMove, MoveKind } from '@gamepark/rules-api'
import { MaterialDescription, StockDescription } from '../MaterialDescription'
import mapValues from 'lodash/mapValues'

export const isMoveToStock = <P extends number, M extends number, L extends number>(
  stocks: Record<M, StockDescription<P, L> | undefined>, move: MaterialMove<P, M, L>, location: Location<P, L>
): boolean => {
  return move.kind === MoveKind.ItemMove && move.type === ItemMoveType.Delete && stocks[move.itemType]?.location.type === location.type
}

export const getStocks = <P extends number, M extends number, L extends number>(material: Record<M, MaterialDescription<P, M, L>>): Record<M, StockDescription<P, L> | undefined> => {
  return mapValues(material, material => material.stock)
}
