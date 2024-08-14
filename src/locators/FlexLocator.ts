import { Coordinates, Location } from '@gamepark/rules-api'
import { ListLocator } from './ListLocator'
import { MaterialContext } from './Locator'

export abstract class FlexLocator<P extends number = number, M extends number = number, L extends number = number> extends ListLocator<P, M, L> {
  lineSize: number = 2

  getLineSize(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number {
    return this.lineSize
  }

  getMaxCount(location: Location<P, L>, context: MaterialContext<P, M, L>): number | undefined {
    return this.getLineSize(location, context)
  }

  lineGap?: Partial<Coordinates>

  getLineGap(_location: Location<P, L>, _context: MaterialContext<P, M, L>): Partial<Coordinates> {
    return this.lineGap ?? {}
  }

  maxLineGap?: Partial<Coordinates>

  getMaxLineGap(location: Location<P, L>, context: MaterialContext<P, M, L>): Partial<Coordinates> {
    if (this.maxLineGap) return this.maxLineGap
    const maxLines = this.getMaxLines(location, context)
    if (maxLines === undefined) return {}
    const { x, y, z } = this.getLineGap(location, context)
    return {
      x: x ? x * (maxLines - 1) : x,
      y: y ? y * (maxLines - 1) : y,
      z: z ? z * (maxLines - 1) : z
    }
  }

  maxLines?: number

  getMaxLines(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number | undefined {
    return this.maxLines
  }

  countListItems(location: Location<P, L>, context: MaterialContext<P, M, L>): number {
    return Math.min(super.countListItems(location, context), this.getLineSize(location, context))
  }

  getAreaCoordinates(location: Location<P, L>, context: MaterialContext<P, M, L>): Partial<Coordinates> {
    const { x = 0, y = 0, z = 0 } = super.getAreaCoordinates(location, context)
    const { x: gx = 0, y: gy = 0 } = this.getLineGap(location, context)
    const { x: mgx, y: mgy } = this.getMaxLineGap(location, context)
    const count = Math.min(this.limit ?? Infinity, super.countItems(location, context))
    const lineSize = this.getLineSize(location, context)
    const lines = Math.floor(count / lineSize)
    return {
      x: x + (mgx ?? gx * lines) / 2,
      y: y + (mgy ?? gy * lines) / 2,
      z
    }
  }

  getLocationCoordinates(location: Location<P, L>, context: MaterialContext<P, M, L>,
                         index = this.getLocationIndex(location, context)): Partial<Coordinates> {
    if (index === undefined) return this.getAreaCoordinates(location, context)
    const lineSize = this.getLineSize(location, context)
    const itemIndex = index % lineSize
    const lineIndex = Math.floor(index / lineSize)
    const count = this.countItems(location, context)
    const lines = Math.floor(count / lineSize)
    const { x = 0, y = 0, z = 0 } = super.getLocationCoordinates(location, context, itemIndex)
    const { x: gx = 0, y: gy = 0, z: gz = 0.05 * lineSize } = this.getLineGap(location, context)
    const { x: mgx, y: mgy, z: mgz } = this.getMaxLineGap(location, context)
    return {
      x: x + lineIndex * (mgx && lines > 1 ? mgx * Math.min(gx / mgx, 1 / (lines - 1)) : gx),
      y: y + lineIndex * (mgy && lines > 1 ? mgy * Math.min(gy / mgy, 1 / (lines - 1)) : gy),
      z: z + lineIndex * (mgz && lines > 1 ? mgz * Math.min(gz / mgz, 1 / (lines - 1)) : gz)
    }
  }
}
