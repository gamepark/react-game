import { MaterialItem } from '@gamepark/rules-api'
import { ItemContext } from '../../../locators'

export function transformItem<P extends number = number, M extends number = number, L extends number = number>(context: ItemContext<P, M, L>): string[] {
  const { rules, type, index, material, dragTransform } = context
  const currentItem: MaterialItem<P, L> = rules.material(type).getItem(index)!
  const locatorTransforms = material[type]?.getItemTransform(currentItem, context) ?? []
  return dragTransform ? [dragTransform, ...locatorTransforms] : locatorTransforms
}