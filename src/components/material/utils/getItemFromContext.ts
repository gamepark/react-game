import { MaterialItem } from '@gamepark/rules-api'
import { ItemContext, MaterialContext } from '../../../locators'

export const getItemFromContext = <P extends number = number, M extends number = number, L extends number = number>(
  context: MaterialContext<P, M, L>, type = (context as ItemContext<P, M, L>).type, index = (context as ItemContext<P, M, L>).index
): MaterialItem<P, L> => {
  return context.game.items[type]![index] as MaterialItem<P, L>
}