import { ItemLocator, PlaceItemContext } from './ItemLocator'
import { Coordinates, MaterialItem } from '@gamepark/rules-api'

export abstract class LineLocator<P extends number = number, M extends number = number, L extends number = number> extends ItemLocator<P, M, L> {
  getPosition(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): Coordinates {
    const coordinates = this.getCoordinates(item, context)
    const index = this.getItemIndex(item, context)
    const delta = this.getDelta(item, context)
    if (this.getDeltaMax) {
      const deltaMax = this.getDeltaMax(item, context)
      const count = this.countItems(item.location, context)
      if (deltaMax.x !== undefined) delta.x = Math.min(delta.x ?? 0, deltaMax.x / count)
      if (deltaMax.y !== undefined) delta.y = Math.min(delta.y ?? 0, deltaMax.y / count)
      if (deltaMax.z !== undefined) delta.z = Math.min(delta.z ?? 0, deltaMax.z / count)
    }
    return { x: coordinates.x + index * (delta.x ?? 0), y: coordinates.y + index * (delta.y ?? 0), z: coordinates.z + index * (delta.z ?? 0) }
  }

  abstract getCoordinates(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): Coordinates

  abstract getDelta(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): Partial<Coordinates>

  getDeltaMax?(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): Partial<Coordinates>
}
