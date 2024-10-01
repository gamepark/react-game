import { getItemFromContext, ItemContext } from '../../../locators'

export function transformItem<P extends number = number, M extends number = number, L extends number = number>(context: ItemContext<P, M, L>): string[] {
  const description = context.material[context.type]
  const currentItem = getItemFromContext(context)
  const locatorTransforms = description?.getItemTransform(currentItem, context) ?? []
  return context.dragTransform ? [context.dragTransform, ...locatorTransforms] : locatorTransforms
}