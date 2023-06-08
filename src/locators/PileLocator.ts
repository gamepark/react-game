import { ItemLocator, PlaceItemContext } from './ItemLocator'
import { Coordinates, DisplayedItem, isDeleteItem, isMoveItem, ItemMove, MaterialItem } from '@gamepark/rules-api'
import { Animation } from '../../../workshop/packages/react-client'

export abstract class PileLocator<P extends number = number, M extends number = number, L extends number = number> extends ItemLocator<P, M, L> {
  limit = 20
  rotate = false
  private positions = new Map<number, Map<number, Coordinates>>()
  private rotations = new Map<number, Map<number, number>>()

  getPosition(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): Coordinates {
    const pileId = this.getPileId(item, context)
    if (!this.positions.has(pileId)) this.positions.set(pileId, new Map())
    const pilePositions = this.positions.get(pileId)!
    const index = this.getItemIndex(item, context)
    const radius = this.getRadius(item, context)
    if (!pilePositions.has(index)) {
      const coordinates = this.getCoordinates(item, context)
      const distance = Math.random()
      const direction = Math.random() * 2 * Math.PI
      pilePositions.set(index, {
        x: coordinates.x + Math.cos(direction) * Math.sqrt(distance) * radius,
        y: coordinates.y + Math.sin(direction) * Math.sqrt(distance) * radius,
        z: coordinates.z
      })
    }
    return pilePositions.get(index)!
  }

  getRotation(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): number {
    if (!this.rotate) return 0
    const pileId = this.getPileId(item, context)
    if (!this.rotations.has(pileId)) this.rotations.set(pileId, new Map())
    const pileRotations = this.rotations.get(pileId)!
    const index = this.getItemIndex(item, context)
    if (!pileRotations.has(index)) {
      pileRotations.set(index, Math.random() * 360)
    }
    return pileRotations.get(index) ?? 0
  }

  abstract getCoordinates(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): Coordinates

  abstract getRadius(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): number

  getPileId(_item: MaterialItem<P, L>, _context: PlaceItemContext<P, M, L>): number {
    return 0
  }

  isItemToAnimate({ displayIndex }: DisplayedItem<M>, animation: Animation<ItemMove<P, M, L>>): boolean {
    if (isMoveItem(animation.move) || isDeleteItem(animation.move)) {
      return displayIndex >= this.limit - (animation.move.quantity ?? 1)
    }
    return false
  }
}
