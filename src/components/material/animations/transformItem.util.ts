import { centerLocator, ItemContext, ItemLocator } from '../../../locators'
import { MaterialItem } from '@gamepark/rules-api'

export function transformItem<P extends number = number, M extends number = number, L extends number = number>(context: ItemContext<P, M, L>): string[] {
  const { rules, type, index, locators } = context
  const currentItem: MaterialItem<P, L> = rules.material(type).getItem(index)!
  const sourceLocator = locators[currentItem.location.type] ?? centerLocator as unknown as ItemLocator<P, M, L>
  return sourceLocator.transformItem(currentItem, context)
}