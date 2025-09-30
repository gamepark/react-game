import { Location, MaterialItem } from '@gamepark/rules-api'
import { ItemContext, LocationContext, Locator, MaterialContext } from './Locator'

/**
 * A locator able to delegate placing items and locations to other locators depending on the context
 */
export abstract class DelegateLocator<P extends number = number, M extends number = number, L extends number = number> extends Locator<P, M, L> {

  abstract getDelegate(context: MaterialContext<P, M, L>): Locator<P, M, L>

  placeItem(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string[] {
    return this.getDelegate(context).placeItem(item, context)
  }

  placeLocation(location: Location<P, L>, context: LocationContext<P, M, L>): string[] {
    return this.getDelegate(context).placeLocation(location, context)
  }
}
