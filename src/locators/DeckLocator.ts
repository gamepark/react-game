import { Coordinates, MaterialItem } from '@gamepark/rules-api'
import { ItemContext } from './Locator'
import { ListLocator } from './ListLocator'

/**
 * This Locator places items to form a deck of cards. A specific use-case for the {@link ListLocator}.
 */
export class DeckLocator<P extends number = number, M extends number = number, L extends number = number> extends ListLocator<P, M, L> {

  constructor(clone?: Partial<DeckLocator>) {
    super()
    Object.assign(this, clone)
  }

  limit? = 20
  gap: Partial<Coordinates> = { x: -0.05, y: -0.05 }

  ignore(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): boolean {
    if (this.limit !== undefined && this.getItemIndex(item, context) < 0) {
      return true
    }
    return super.ignore(item, context)
  }
}
