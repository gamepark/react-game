import { Coordinates, MaterialItem } from '@gamepark/rules-api'
import { ListLocator } from './ListLocator'
import { ItemContext } from './Locator'

/**
 * This Locator places items to form a deck of cards. A specific use-case for the {@link ListLocator}.
 */
export class DeckLocator<P extends number = number, M extends number = number, L extends number = number> extends ListLocator<P, M, L> {

  constructor(clone?: Partial<DeckLocator>) {
    super()
    Object.assign(this, clone)
  }

  limit = 20
  gap: Partial<Coordinates> = { x: -0.05, y: -0.05 }

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
}
