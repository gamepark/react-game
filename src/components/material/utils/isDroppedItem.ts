import { ItemContext } from '../../../locators'
import { getItemFromContext } from './getItemFromContext'
import { isPlacedOnItem } from './isPlacedOnItem'

export const isDroppedItem = <P extends number = number, M extends number = number, L extends number = number>(
  context: ItemContext<P, M, L>
): boolean => {
  const droppedItem = context.game.droppedItem
  if (!droppedItem) return false
  if (droppedItem.type === context.type && droppedItem.index === context.index && droppedItem.displayIndex === context.displayIndex) return true
  return isPlacedOnItem(getItemFromContext(context), droppedItem, context)
}