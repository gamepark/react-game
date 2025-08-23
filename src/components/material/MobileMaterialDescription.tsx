/** @jsxImportSource @emotion/react */
import { DeleteItem, isDeleteItem, isMoveItem, isMoveItemsAtOnce, MaterialMove, MoveItem, MoveItemsAtOnce } from '@gamepark/rules-api'
import isEqual from 'lodash/isEqual'
import { getItemFromContext, ItemContext } from '../../locators'
import { MaterialDescription } from './MaterialDescription'

export abstract class MobileMaterialDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends MaterialDescription<P, M, L, ItemId> {
  isMobile = true

  canDrag(move: MaterialMove<P, M, L>, context: ItemContext<P, M, L>): boolean {
    if (isMoveItem(move)) {
      return move.location?.type !== undefined && move.itemType === context.type && move.itemIndex === context.index && this.canDragToMove(move, context)
    } else if (isDeleteItem(move)) {
      return move.itemType === context.type && move.itemIndex === context.index && this.canDragToDelete(move, context)
    } else if (isMoveItemsAtOnce(move)) {
      return move.itemType === context.type && move.indexes.includes(context.index) && this.canDragToMove(move, context)
    } else {
      return false
    }
  }

  protected canDragToMove(move: MoveItem<P, M, L> | MoveItemsAtOnce<P, M, L>, context: ItemContext<P, M, L>): boolean {
    const { rotation, ...actualLocation } = getItemFromContext(context).location
    const { rotation: nextRotation, ...nextLocation } = move.location
    return !isEqual(actualLocation, nextLocation)
  }

  protected canDragToDelete(_move: DeleteItem<M>, context: ItemContext<P, M, L>): boolean {
    return this.getStockLocation(getItemFromContext(context), context) !== undefined
  }
}
