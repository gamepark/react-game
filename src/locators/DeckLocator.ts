import { Coordinates, MaterialItem } from '@gamepark/rules-api'
import { ItemContext } from './ItemLocator'
import { LineLocator } from './LineLocator'

export abstract class DeckLocator<P extends number = number, M extends number = number, L extends number = number> extends LineLocator<P, M, L> {
  limit = 20

  hide(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): boolean {
    if (!this.limit) return false
    const index = super.getItemIndex(item, context)
    const count = this.countItems(item.location, context)
    return index < count - this.limit
  }

  getItemIndex(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): number {
    const index = super.getItemIndex(item, context)
    if (!this.limit) return index
    const count = this.countItems(item.location, context)
    if (count <= this.limit) return index
    return Math.max(0, index - count + this.limit)
  }

  getDelta(_item: MaterialItem<P, L>, context: ItemContext<P, M, L>): Partial<Coordinates> {
    return this.delta ?? { z: context.material[context.type]?.thickness ?? 0.05 }
  }
}
