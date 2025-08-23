import { MaterialItem, Polyhex } from '@gamepark/rules-api'
import { ItemContext } from '../../../locators'
import { ComponentDescription } from '../ComponentDescription'
import { FlatMaterialDescription } from './FlatMaterial'

export abstract class PolyhexDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any, T = any>
  extends FlatMaterialDescription<P, M, L, ItemId> {

  /**
   * The shape of the polyhex (use getPolyhexShape if it varies depending on the item)
   * IMPORTANT: all falsy values (0, null...) are considered as blank hex.
   */
  polyhex: Polyhex<T> = new Polyhex<T>([])

  /**
   * This function must return the shape of the polyhex, as a Matrix.
   * IMPORTANT: all falsy values (0, null...) are considered as blank hex.
   * @param _item Item
   * @param _context Context of the item
   * @returns Matrix representing the polyhex. Falsy values will be considered are blank spots
   */
  getPolyhex(_item: MaterialItem<P, L, ItemId>, _context: ItemContext<P, M, L>): Polyhex<T> {
    return this.polyhex
  }
}

export function isPolyhexDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>(
  description: ComponentDescription<ItemId>
): description is PolyhexDescription<P, M, L, ItemId> {
  return typeof (description as PolyhexDescription).getPolyhex === 'function'
}
