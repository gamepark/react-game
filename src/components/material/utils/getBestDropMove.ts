import { DragEndEvent, DragMoveEvent } from '@dnd-kit/core'
import { Location, MaterialMove } from '@gamepark/rules-api'
import { MaterialContext } from '../../../locators'
import { dataIsDisplayedItem } from '../DraggableMaterial'
import { DropAreaDescription } from '../locations'

export function getBestDropMove<P extends number = number, M extends number = number, L extends number = number>(
  event: DragMoveEvent | DragEndEvent, context: MaterialContext<P, M, L>, legalMoves: MaterialMove<P, M, L>[]
): MaterialMove<P, M, L> | undefined {
  if (event.over && dataIsDisplayedItem<M>(event.active.data.current) && dataIsLocation<P, L>(event.over.data.current)) {
    const item = event.active.data.current
    const description = context.material[item.type]
    const location = event.over.data.current
    const locator = context.locators[location.type]
    const itemContext = { ...context, ...item }
    const locationDescription = locator?.getLocationDescription(location, itemContext) as DropAreaDescription<P, M, L>
    const moves = legalMoves.filter(move =>
      description?.canDrag(move, itemContext) && locationDescription?.canDrop?.(move, location, itemContext)
    )
    if (moves.length > 0) {
      return moves.length === 1 ? moves[0] : locationDescription.getBestDropMove(moves, location, itemContext, event)
    }
  }
}

function dataIsLocation<P extends number = number, L extends number = number>(data?: Record<string, any>): data is Location<P, L> {
  return typeof data?.type === 'number'
}
