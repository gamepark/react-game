import { getItemFromContext, ItemContext } from '../../../locators'

export function transformItem<P extends number = number, M extends number = number, L extends number = number>(context: ItemContext<P, M, L>): string[] {
  const description = context.material[context.type]
  const currentItem = getItemFromContext(context)
  return description?.getItemTransform(currentItem, context) ?? []
}