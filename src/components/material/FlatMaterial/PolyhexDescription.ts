import { HexGridSystem, MaterialItem, XYCoordinates } from '@gamepark/rules-api'
import { ItemContext } from '../../../locators'
import { ComponentDescription } from '../ComponentDescription'
import { FlatMaterialDescription } from './FlatMaterial'

export abstract class PolyhexDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends FlatMaterialDescription<P, M, L, ItemId> {

  abstract coordinatesSystem: HexGridSystem

  getPolyhexShape(_item: MaterialItem<P, L, ItemId>, _context: ItemContext<P, M, L>): XYCoordinates[] {
    return [{ x: 0, y: 0 }]
  }
}

export function isPolyhexDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>(
  description: ComponentDescription<ItemId>
): description is PolyhexDescription<P, M, L, ItemId> {
  return typeof (description as PolyhexDescription).getPolyhexShape === 'function'
}
