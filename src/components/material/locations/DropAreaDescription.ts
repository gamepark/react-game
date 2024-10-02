import { DragEndEvent } from '@dnd-kit/core'
import { isMoveItem, Location, MaterialMove } from '@gamepark/rules-api'
import isEqual from 'lodash/isEqual'
import { ElementType } from 'react'
import { ItemContext } from '../../../locators'
import { LocationDescription } from './LocationDescription'
import { SimpleDropArea } from './SimpleDropArea'

export class DropAreaDescription<P extends number = number, M extends number = number, L extends number = number, Id = any>
  extends LocationDescription<P, M, L, Id> {

  Component: ElementType = SimpleDropArea

  canDrop(move: MaterialMove<P, M, L>, location: Location<P, L>, context: ItemContext<P, M, L>): boolean {
    return this.isMoveToLocation(move, location, context)
  }

  getBestDropMove(moves: MaterialMove<P, M, L>[], location: Location<P, L>, context: ItemContext<P, M, L>, _event: DragEndEvent): MaterialMove<P, M, L> {
    const exactMove = moves.find((move) => isMoveItem(move) && isEqual(location, move.location))
    if (exactMove) return exactMove

    const moveWithSameRotation = moves.find(move =>
      isMoveItem(move) && move.location.rotation === context.rules.material(move.itemType).getItem(move.itemIndex)?.location.rotation
    )
    return moveWithSameRotation ?? moves[0]
  }
}
