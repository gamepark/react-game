import { ItemLocator, PlaceItemContext } from './ItemLocator'
import { Coordinates, Location, MaterialItem } from '@gamepark/rules-api'

export abstract class LineLocator<P extends number = number, M extends number = number, L extends number = number> extends ItemLocator<P, M, L> {
  getPosition(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): Coordinates {
    const coordinates = this.getCoordinates(item.location, context)
    const index = this.getItemIndex(item, context)
    const delta = this.getDelta(item.location, context)
    return { x: coordinates.x + index * delta.x, y: coordinates.y + index * delta.y, z: coordinates.z + index * delta.z }
  }

  abstract getCoordinates(location: Location<P, L>, context: PlaceItemContext<P, M, L>): Coordinates

  abstract getDelta(_location: Location<P, L>, _context: PlaceItemContext<P, M, L>): Coordinates
}
