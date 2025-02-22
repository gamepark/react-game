import isEqual from 'lodash/isEqual'
import { getItemFromContext, ItemContext } from '../../../locators'

export const getFirstStockItemTransforms = <P extends number = number, M extends number = number, L extends number = number>(
  context: ItemContext<P, M, L>
): string[] => {
  const description = context.material[context.type]
  const item = getItemFromContext(context)
  const stockLocation = description?.getStockLocation(item, context)
  if (!description || !stockLocation) return []
  const stockItem = description?.getStaticItems(context).find(item => isEqual(item.location, stockLocation))
  const displayIndex = stockItem?.quantity ? stockItem.quantity - 1 : 0
  return description.getItemTransform(stockItem ?? { location: stockLocation }, { ...context, index: 0, displayIndex })
}