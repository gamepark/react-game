import { ItemMoveType, Location, MaterialMove, MoveKind } from '@gamepark/rules-api'
import { MaterialDescription } from '../MaterialDescription'
import keyBy from 'lodash.keyby'

export const isMoveToStock = <P extends number, M extends number, L extends number>(
  stocks: Record<string, MaterialDescription<P, M, L>>, move: MaterialMove<P, M, L>, location: Location<P, L>
): boolean => {
  return location.type in stocks && move.kind === MoveKind.ItemMove && move.type === ItemMoveType.Delete
}

export const getStocks = <P extends number, M extends number, L extends number>(material: Record<M, MaterialDescription<P, M, L>>): Record<string, MaterialDescription<P, M, L>> => {
  const materialWithStock = Object
    .entries<MaterialDescription<P, M, L>>(material)
    .filter(([, description]) => description.stock)
    .map(([, description]) => description)
  return keyBy(materialWithStock, (material) => material.stock!.location.type)
}
