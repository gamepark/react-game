import { Coordinates, MaterialItem } from '@gamepark/rules-api'
import { ItemContext, Locator } from './Locator'

export abstract class HandLocator<P extends number = number, M extends number = number, L extends number = number> extends Locator<P, M, L> {
  getItemCoordinates(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): Coordinates {
    const { x = 0, y = 0, z = 0 } = this.getCoordinates(item.location, context)
    const index = this.getItemIndex(item, context)
    const deltaZ = this.getDeltaZ(item, context)
    const radius = this.getRadius(item, context)
    const baseAngle = this.getBaseAngle(item, context)
    const angle = this.getItemAngle(item, context)
    return {
      x: x + radius * Math.sin(angle * Math.PI / 180) - radius * Math.sin(baseAngle * Math.PI / 180),
      y: y - radius * Math.cos(angle * Math.PI / 180) + radius * Math.cos(baseAngle * Math.PI / 180),
      z: z + index * deltaZ
    }
  }

  getRotateZ(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): number {
    return this.getItemAngle(item, context)
  }

  getItemAngle(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): number {
    const index = this.getItemIndex(item, context)
    const size = this.countItems(item.location, context)
    const maxAngle = this.getMaxAngle(item, context)
    const gapMaxAngle = this.getGapMaxAngle(item, context)
    const gapAngle = size > 1 ? Math.min(maxAngle / (size - 1), gapMaxAngle) : 0
    const baseAngle = this.getBaseAngle(item, context)
    return baseAngle + (index - (size - 1) / 2) * gapAngle * (this.isClockwise(item, context) ? 1 : -1)
  }

  getItemIndex(item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): number {
    return item.location.x ?? 0
  }

  getRadius(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): number {
    return 100
  }

  getBaseAngle(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): number {
    return 0
  }

  getMaxAngle(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): number {
    return 15
  }

  getGapMaxAngle(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): number {
    return 3
  }

  isClockwise(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): boolean {
    return true
  }

  getDeltaZ(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): number {
    return 0.05
  }
}
