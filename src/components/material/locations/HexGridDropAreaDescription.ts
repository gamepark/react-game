import { DragEndEvent, DragMoveEvent } from '@dnd-kit/core'
import { isMoveItem, Location, MaterialMove } from '@gamepark/rules-api'
import minBy from 'lodash/minBy'
import { ElementType } from 'react'
import { getItemFromContext, HexagonalGridLocator, ItemContext, Locator } from '../../../locators'
import { DropAreaDescription } from './DropAreaDescription'
import { SimpleDropArea } from './SimpleDropArea'

export class HexGridDropAreaDescription<P extends number = number, M extends number = number, L extends number = number, Id = any>
  extends DropAreaDescription<P, M, L, Id> {

  Component: ElementType = SimpleDropArea

  canDrop(move: MaterialMove<P, M, L>, location: Location<P, L>, context: ItemContext<P, M, L>): boolean {
    return this.isMoveToLocation(move, location, context)
  }

  getBestDropMove(moves: MaterialMove<P, M, L>[], location: Location<P, L>, context: ItemContext<P, M, L>, event: DragMoveEvent | DragEndEvent): MaterialMove<P, M, L> {
    const itemRect = event.active.rect.current.translated
    const dropAreaRect = event.over?.rect
    if (itemRect && dropAreaRect) {
      const description = context.material[context.type]!
      const item = getItemFromContext(context)
      const { width, height } = description.getSize(item.id)
      const dropAreaCenter = { x: dropAreaRect.left + dropAreaRect.width / 2, y: dropAreaRect.top + dropAreaRect.height / 2 }
      const itemCenter = { x: itemRect.left + itemRect.width / 2, y: itemRect.top + itemRect.height / 2 }
      const itemDeltaCenter = {
        x: (itemCenter.x - dropAreaCenter.x) * width / itemRect.width, // Convert pixels to em
        y: (itemCenter.y - dropAreaCenter.y) * height / itemRect.height // Convert pixels to em
      }
      const locator = context.locators[location.type]!
      const { x: lx = 0, y: ly = 0 } = locator.getLocationCoordinates(location, context)
      if (isHexagonalGridLocator(locator)) {
        const bestMove = minBy(moves, move => {
          if (isMoveItem(move) && move.location.type === location.type) {
            const { x = 0, y = 0 } = locator.getItemCoordinates({ ...item, location: move.location as Location<P, L> }, context)
            return Math.sqrt(Math.pow(x - lx - itemDeltaCenter.x, 2) + Math.pow(y - ly - itemDeltaCenter.y, 2))
              + Math.abs((Math.abs((move.location.rotation ?? 0) - (item.location.rotation ?? 0)) + 3) % 6 - 3) / 3
          }
          return Infinity
        })
        if (bestMove) {
          return bestMove
        }
      }
    }
    return super.getBestDropMove(moves, location, context, event)
  }
}

function isHexagonalGridLocator<P extends number = number, M extends number = number, L extends number = number>(
  locator: Locator<P, M, L>
): locator is HexagonalGridLocator<P, M, L> {
  return typeof (locator as HexagonalGridLocator<P, M, L>).coordinatesSystem === 'number'
}
