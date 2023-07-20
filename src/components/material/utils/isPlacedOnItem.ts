import { DisplayedItem, MaterialItem } from '@gamepark/rules-api'
import { MaterialContext } from '../../../locators'
import { getItemFromContext } from './getItemFromContext'

export const isPlacedOnItem = <P extends number = number, M extends number = number, L extends number = number>(
  childItem: MaterialItem<P, L>, item: Omit<DisplayedItem<M>, 'displayIndex'>, context: MaterialContext<P, M, L>
): boolean => {
  if (childItem.location.parent === undefined) return false
  const locator = context.locators[childItem.location.type]
  if (locator.parentItemType === item.type && childItem.location.parent === item.index) return true
  const parentItem = getItemFromContext(context, locator.parentItemType, childItem.location.parent)
  return isPlacedOnItem(parentItem, item, context)
}