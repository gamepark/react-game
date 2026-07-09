import { MaterialItem, Polyomino } from '@gamepark/rules-api'
import { ItemContext } from '../../../locators'
import { ComponentDescription } from '../ComponentDescription'
import { FlatMaterialDescription } from './FlatMaterial'

export abstract class PolyominoDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any, T = any, R extends number = number, V extends number = number>
  extends FlatMaterialDescription<P, M, L, ItemId, R, V> {

  /**
   * The shape of the polyomino (use getPolyomino if it varies depending on the item)
   * IMPORTANT: all falsy values (0, null...) are considered as blank square.
   */
  polyomino: Polyomino<T> = new Polyomino<T>([])

  /**
   * This function must return the shape of the polyomino, as a Matrix.
   * IMPORTANT: all falsy values (0, null...) are considered as blank square.
   * @param _item Item
   * @param _context Context of the item
   * @returns Matrix representing the polyomino. Falsy values will be considered as blank spots
   */
  getPolyomino(_item: MaterialItem<P, L, ItemId>, _context: ItemContext<P, M, L, R, V>): Polyomino<T> {
    return this.polyomino
  }
}

export function isPolyominoDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any, R extends number = number, V extends number = number>(
  description: ComponentDescription<ItemId>
): description is PolyominoDescription<P, M, L, ItemId, any, R, V> {
  return typeof (description as PolyominoDescription).getPolyomino === 'function'
}
