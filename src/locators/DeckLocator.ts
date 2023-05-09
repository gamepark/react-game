import { Coordinates, Location, MaterialItem } from '@gamepark/rules-api'
import { LineLocator } from './LineLocator'
import { PlaceItemContext } from './ItemLocator'

export abstract class DeckLocator<P extends number = number, M extends number = number, L extends number = number> extends LineLocator<P, M, L> {
  limit = 20

  hide(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): boolean {
    return this.getItemIndex(item, context) < 0
  }

  getItemIndex(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): number {
    const index = super.getItemIndex(item, context)
    if (!this.limit) return index
    const count = this.countItems(item.location, context)
    if (count <= this.limit) return index
    return index - count + this.limit
  }

  getDelta(_location: Location<P, L>, _context: PlaceItemContext<P, M, L>): Coordinates {
    return { x: 0, y: 0, z: 0.05 }
  }
}
