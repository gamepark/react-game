import { Location, MaterialItem } from '@gamepark/rules-api'
import { ItemContext, LocationContext, Locator, MaterialContext } from './Locator'

/**
 * A locator able to delegate placing items and locations to other locators depending on the context
 */
export abstract class DelegateLocator<P extends number = number, M extends number = number, L extends number = number, R extends number = number, V extends number = number> extends Locator<P, M, L, R, V> {

  abstract getDelegate(context: MaterialContext<P, M, L, R, V>): Locator<P, M, L, R, V>

  placeItem(item: MaterialItem<P, L>, context: ItemContext<P, M, L, R, V>): string[] {
    return this.getDelegate(context).placeItem(item, context)
  }

  placeLocation(location: Location<P, L>, context: LocationContext<P, M, L, R, V>): string[] {
    return this.getDelegate(context).placeLocation(location, context)
  }
}
