import { MaterialItem } from '@gamepark/rules-api'
import { centerLocator, ItemContext, Locator } from '../../../locators'

export function transformItem<P extends number = number, M extends number = number, L extends number = number>(context: ItemContext<P, M, L>): string[] {
  const { rules, type, index, locators, dragTransform } = context
  const currentItem: MaterialItem<P, L> = rules.material(type).getItem(index)!
  const sourceLocator = locators[currentItem.location.type] ?? centerLocator as unknown as Locator<P, M, L>
  const locatorTransforms = sourceLocator.transformItem(currentItem, context)
  return dragTransform ? [dragTransform, ...locatorTransforms] : locatorTransforms
}