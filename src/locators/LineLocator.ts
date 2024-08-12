import { Coordinates, Location, MaterialItem } from '@gamepark/rules-api'
import { ItemContext, Locator, MaterialContext } from './Locator'

export abstract class LineLocator<P extends number = number, M extends number = number, L extends number = number> extends Locator<P, M, L> {

  getOriginCoordinates(_location: Location<P, L>, _context: MaterialContext<P, M, L>): Partial<Coordinates> {
    return this.coordinates
  }

  getLocationCoordinates(location: Location<P, L>, context: MaterialContext<P, M, L>,
                         index = this.getLocationIndex(location, context) ?? 0): Coordinates {
    const { x = 0, y = 0, z = 0 } = this.getOriginCoordinates(location, context)
    let delta = this.getDelta(location, context)
    if (this.getDeltaMax) {
      const count = this.countItems(location, context)
      if (count > 1) {
        const deltaMax = this.getDeltaMax(location, context)
        delta.x = this.getDeltaValue(delta.x, deltaMax.x, count)
        delta.y = this.getDeltaValue(delta.y, deltaMax.y, count)
        delta.z = this.getDeltaValue(delta.z ?? 0.05, deltaMax.z, count)
      }
    }
    return { x: x + index * (delta.x ?? 0), y: y + index * (delta.y ?? 0), z: z + index * (delta.z ?? 0) }
  }

  getItemCoordinates(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): Coordinates {
    const { x, y, z } = this.getLocationCoordinates(item.location, context, this.getItemIndex(item, context))
    const thickness = context.material[context.type]?.thickness ?? 0
    return { x, y, z: z + thickness }
  }


  getDeltaValue(delta: number = 0, max: number | undefined, count: number) {
    if (max !== undefined && max > 0) return Math.min(delta, max / (count - 1))
    if (max !== undefined && max < 0) return Math.max(delta, max / (count - 1))
    return delta
  }

  delta?: Partial<Coordinates>

  getDelta(_location: Location<P, L>, _context: MaterialContext<P, M, L>): Partial<Coordinates> {
    return this.delta ?? {}
  }

  deltaMax?: Partial<Coordinates>

  getDeltaMax(_location: Location<P, L>, _context: MaterialContext<P, M, L>): Partial<Coordinates> {
    return this.deltaMax ?? {}
  }
}
