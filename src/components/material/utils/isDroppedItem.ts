import { getItemFromContext, ItemContext } from '../../../locators'
import { isPlacedOnItem } from './isPlacedOnItem'

export const isDroppedItem = <P extends number = number, M extends number = number, L extends number = number>(
  context: Omit<ItemContext<P, M, L>, 'displayIndex'> & { displayIndex?: number }
): boolean => {
  const { type, index, displayIndex, rules } = context
  const droppedItems = rules.game.droppedItems
  if (!droppedItems) return false
  return droppedItems.some((droppedItem) =>
    (droppedItem.type === type && droppedItem.index === index && (displayIndex === undefined || droppedItem.displayIndex === displayIndex))
    || isPlacedOnItem(getItemFromContext(context), { ...context, ...droppedItem })
  )
}