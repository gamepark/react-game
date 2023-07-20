import { DeleteItem, MoveItem } from '@gamepark/rules-api'
import { ItemContext } from '../../../locators'

export const isMovedOrDeletedItem = <P extends number = number, M extends number = number, L extends number = number>(
  { game, type, index, displayIndex, locators }: ItemContext<P, M, L>, move: MoveItem<P, M, L> | DeleteItem<M>
): boolean => {
  if (move.itemType !== type || move.itemIndex !== index) return false
  const item = game.items[type]![index]
  let quantity = item.quantity ?? 1
  if (quantity === 1) return true
  const itemLocator = locators[item.location.type]
  if (itemLocator.limit) quantity = Math.min(quantity, itemLocator.limit)
  const movedQuantity = move.quantity ?? 1
  if (game.droppedItem?.type === type && game.droppedItem.index === index) {
    const droppedIndex = game.droppedItem.displayIndex
    if (displayIndex === droppedIndex) return true
    if (droppedIndex < quantity - movedQuantity) {
      return displayIndex > quantity - movedQuantity
    }
  }
  return displayIndex >= quantity - movedQuantity
}