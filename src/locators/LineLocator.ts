import { ItemLocator, PlaceItemContext } from './ItemLocator'
import { Coordinates, MaterialItem } from '@gamepark/rules-api'

export abstract class LineLocator<P extends number = number, M extends number = number, L extends number = number> extends ItemLocator<P, M, L> {
  getPosition(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): Coordinates {
    const coordinates = this.getCoordinates(item, context)
    const index = this.getItemIndex(item, context)
    const delta = this.getDelta(item, context)
    return { x: coordinates.x + index * (delta.x ?? 0), y: coordinates.y + index * (delta.y ?? 0), z: coordinates.z + index * (delta.z ?? 0) }
  }

  abstract getCoordinates(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): Coordinates

  abstract getDelta(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): Partial<Coordinates>
}
