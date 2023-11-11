import { Coordinates, MaterialItem } from '@gamepark/rules-api'
import { ItemContext, ItemLocator } from './ItemLocator'

export abstract class LineLocator<P extends number = number, M extends number = number, L extends number = number> extends ItemLocator<P, M, L> {
  getPosition(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): Coordinates {
    const coordinates = this.getCoordinates(item, context)
    const index = this.getItemIndex(item, context)
    let delta = this.getDelta(item, context)
    if (this.getDeltaMax) {
      const count = this.countItems(item.location, context)
      if (count > 1) {
        const deltaMax = this.getDeltaMax(item, context)
        delta = { ...delta }
        delta.x = this.getDeltaValue(delta.x, deltaMax.x, count)
        delta.y = this.getDeltaValue(delta.y, deltaMax.y, count)
        delta.z = this.getDeltaValue(delta.z, deltaMax.z, count)
      }
    }
    return { x: coordinates.x + index * (delta.x ?? 0), y: coordinates.y + index * (delta.y ?? 0), z: coordinates.z + index * (delta.z ?? 0) }
  }

  getDeltaValue(delta: number = 0, max: number | undefined, count: number) {
    if (max !== undefined && max > 0) return Math.min(delta, max / (count - 1))
    if (max !== undefined && max < 0) return Math.max(delta, max / (count - 1))
    return delta
  }

  coordinates: Coordinates = { x: 0, y: 0, z: 0 }

  getCoordinates(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): Coordinates {
    return this.coordinates
  }

  delta?: Partial<Coordinates>

  getDelta(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): Partial<Coordinates> {
    return this.delta ?? {}
  }

  deltaMax?: Partial<Coordinates>

  getDeltaMax(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): Partial<Coordinates> {
    return this.deltaMax ?? {}
  }
}
