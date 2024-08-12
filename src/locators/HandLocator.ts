import { Coordinates, Location, MaterialItem } from '@gamepark/rules-api'
import { ItemContext, Locator, MaterialContext } from './Locator'

export abstract class HandLocator<P extends number = number, M extends number = number, L extends number = number> extends Locator<P, M, L> {
  getHandCoordinates(_location: Location<P, L>, _context: MaterialContext<P, M, L>) {
    return this.coordinates
  }

  getLocationCoordinates(location: Location<P, L>, context: MaterialContext<P, M, L>): Coordinates {
    const { x = 0, y = 0, z = 0 } = this.getHandCoordinates(location, context)
    const index = this.getLocationIndex(location, context) ?? 0
    const deltaZ = this.getDeltaZ(location, context)
    const radius = this.getRadius(location, context)
    const baseAngle = this.getBaseAngle(location, context)
    const angle = this.getRotateZ(location, context)
    return {
      x: x + radius * Math.sin(angle * Math.PI / 180) - radius * Math.sin(baseAngle * Math.PI / 180),
      y: y - radius * Math.cos(angle * Math.PI / 180) + radius * Math.cos(baseAngle * Math.PI / 180),
      z: z + index * deltaZ
    }
  }

  getItemCoordinates(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): Coordinates {
    return this.getLocationCoordinates(item.location, context)
  }

  getRotateZ(location: Location<P, L>, context: MaterialContext<P, M, L>): number {
    const index = this.getLocationIndex(location, context)
    const baseAngle = this.getBaseAngle(location, context)
    if (index === undefined) return baseAngle
    const size = this.countItems(location, context)
    const maxAngle = this.getMaxAngle(location, context)
    const gapMaxAngle = this.getGapMaxAngle(location, context)
    const gapAngle = size > 1 ? Math.min(maxAngle / (size - 1), gapMaxAngle) : 0
    return baseAngle + (index - (size - 1) / 2) * gapAngle * (this.isClockwise(location, context) ? 1 : -1)
  }

  getRadius(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number {
    return 100
  }

  getBaseAngle(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number {
    return 0
  }

  getMaxAngle(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number {
    return 15
  }

  getGapMaxAngle(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number {
    return 3
  }

  isClockwise(_location: Location<P, L>, _context: MaterialContext<P, M, L>): boolean {
    return true
  }

  getDeltaZ(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number {
    return 0.05
  }
}
