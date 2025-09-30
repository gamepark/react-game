import { MaterialItem } from '@gamepark/rules-api'
import { ItemContext, Locator } from './Locator'

/**
 * Locator that hides all the items but defines coordinates to animate the items from and to when they move
 */
export class PlaceholderLocator<P extends number = number, M extends number = number, L extends number = number> extends Locator<P, M, L> {
  hide() {
    return true
  }

  placeItem(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string[] {
    return super.placeItem(item, context).concat(`scale(0)`)
  }
}
