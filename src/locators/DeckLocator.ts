import { Coordinates, MaterialItem } from '@gamepark/rules-api'
import { LineLocator } from './LineLocator'
import { PlaceItemContext } from './ItemLocator'

export abstract class DeckLocator<P extends number = number, M extends number = number, L extends number = number> extends LineLocator<P, M, L> {
  limit = 20

  hide(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): boolean {
    if (!this.limit) return false
    const index = super.getItemIndex(item, context)
    const count = this.countItems(item.location, context)
    return index < count - this.limit
  }

  getItemIndex(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): number {
    const index = super.getItemIndex(item, context)
    if (!this.limit) return index
    const count = this.countItems(item.location, context)
    if (count <= this.limit) return index
    return Math.max(0, index - count + this.limit)
  }

  getDelta(_item: MaterialItem<P, L>, _context: PlaceItemContext<P, M, L>): Partial<Coordinates> {
    return { z: 0.05 }
  }
}
