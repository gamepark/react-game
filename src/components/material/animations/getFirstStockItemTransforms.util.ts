import { ItemContext } from '../../../locators'
import equal from 'fast-deep-equal'

export const getFirstStockItemTransforms = <P extends number = number, M extends number = number, L extends number = number>(
  context: ItemContext<P, M, L>
): string[] => {
  const { game, type, index, locators, material } = context
  const item = game.items[type]![index]
  const description = material[type]
  const stockLocation = description.getStockLocation(item, context)
  if (!stockLocation) return []
  const stockItem = description.getStaticItems(context).find(item => equal(item.location, stockLocation))
  const displayIndex = stockItem?.quantity ? stockItem.quantity - 1 : 0
  const stockLocator = locators[stockLocation.type]
  return stockLocator.transformItem(stockItem ?? { location: stockLocation }, { ...context, index: 0, displayIndex })
}