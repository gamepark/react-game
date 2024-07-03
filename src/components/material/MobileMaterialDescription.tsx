/** @jsxImportSource @emotion/react */
import { DeleteItem, isDeleteItem, isMoveItem, MaterialMove, MoveItem } from '@gamepark/rules-api'
import isEqual from 'lodash/isEqual'
import { ItemContext } from '../../locators'
import { MaterialDescription } from './MaterialDescription'

export abstract class MobileMaterialDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends MaterialDescription<P, M, L, ItemId> {
  isMobile = true

  canDrag(move: MaterialMove<P, M, L>, context: ItemContext<P, M, L>): boolean {
    if (isMoveItem(move)) {
      return move.location?.type !== undefined && move.itemType === context.type && move.itemIndex === context.index && this.canDragToMove(move, context)
    } else if (isDeleteItem(move)) {
      return move.itemType === context.type && move.itemIndex === context.index && this.canDragToDelete(move, context)
    } else {
      return false
    }
  }

  protected canDragToMove(move: MoveItem<P, M, L>, { type, index, rules }: ItemContext<P, M, L>): boolean {
    const { rotation, ...actualLocation } = rules.material(type).getItem(index)?.location!
    const { rotation: nextRotation, ...nextLocation } = move.location
    return !isEqual(actualLocation, nextLocation)
  }

  protected canDragToDelete(_move: DeleteItem<M>, _context: ItemContext<P, M, L>): boolean {
    return this.stockLocation !== undefined
  }
}
