import { MoveItem } from '@gamepark/rules-api'
import { isEqual } from 'es-toolkit'
import { MaterialContext } from '../../../locators'

export const isRotationMove = <P extends number = number, M extends number = number, L extends number = number>(
  move: MoveItem<P, M, L>, context: MaterialContext<P, M, L>
) => {
  const { rotation: itemRotation, ...itemLocation } = context.rules.material(move.itemType).getItem(move.itemIndex)!.location
  const { rotation: moveRotation, ...moveLocation } = move.location
  return isEqual(itemLocation, moveLocation) && !isEqual(itemRotation, moveRotation)
}
