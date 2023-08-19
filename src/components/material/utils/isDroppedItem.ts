import { ItemContext } from '../../../locators'
import { isPlacedOnItem } from './isPlacedOnItem'

export const isDroppedItem = <P extends number = number, M extends number = number, L extends number = number>(
  context: ItemContext<P, M, L>
): boolean => {
  const { type, index, displayIndex, rules } = context
  const droppedItem = rules.game.droppedItem
  if (!droppedItem) return false
  if (droppedItem.type === type && droppedItem.index === index && droppedItem.displayIndex === displayIndex) return true
  return isPlacedOnItem(rules.material(type).getItem(index)!, droppedItem, context)
}