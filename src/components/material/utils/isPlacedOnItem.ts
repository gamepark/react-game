import { MaterialItem } from '@gamepark/rules-api'
import { ItemContext } from '../../../locators'

export const isPlacedOnItem = <P extends number = number, M extends number = number, L extends number = number>(
  childItem: MaterialItem<P, L>, itemContext: Omit<ItemContext<P, M, L>, 'displayIndex'>
): boolean => {
  if (childItem.location.parent === undefined) return false
  const locator = itemContext.locators[childItem.location.type]
  if (locator?.parentItemType === itemContext.type && childItem.location.parent === itemContext.index) return true
  const parentItem = itemContext.rules.material(locator!.parentItemType!).getItem(childItem.location.parent)
  return parentItem !== undefined && isPlacedOnItem(parentItem, itemContext)
}