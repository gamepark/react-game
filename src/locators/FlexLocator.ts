import { Coordinates, Location, XYCoordinates } from '@gamepark/rules-api'
import { ListLocator } from './ListLocator'
import { MaterialContext } from './Locator'

/**
 * This Locator places a list of items as a grid, with break points for the lines. Inspired by the CSS flexbox.
 */
export class FlexLocator<P extends number = number, M extends number = number, L extends number = number> extends ListLocator<P, M, L> {

  constructor(clone?: Partial<FlexLocator>) {
    super()
    Object.assign(this, clone)
  }

  /**
   * The number of items per line.
   */
  lineSize: number = 2

  /**
   * Function to override to provide a {@link lineSize} that depends on the context
   * @param _location Location to position
   * @param _context Context of the game
   * @returns The number of items per line.
   */
  getLineSize(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number {
    return this.lineSize
  }

  getMaxCount(location: Location<P, L>, context: MaterialContext<P, M, L>): number | undefined {
    return this.getLineSize(location, context)
  }

  /**
   * The default gap between 2 consecutive lines
   */
  lineGap?: Partial<Coordinates>

  /**
   * Function to override to provide a {@link getLineGap} that depends on the context
   * @param _location Location to position
   * @param _context Context of the game
   * @returns The default gap between 2 consecutive lines
   */
  getLineGap(_location: Location<P, L>, _context: MaterialContext<P, M, L>): Partial<Coordinates> {
    return this.lineGap ?? {}
  }

  /**
   * The maximum number of lines displayed before the gap between the lines is reduced to fill in the same space.
   */
  maxLines?: number

  /**
   * Function to override to provide a {@link maxLines} that depends on the context
   * @param _location Location to position
   * @param _context Context of the game
   * @returns The maximum number of lines displayed before the gap between the lines is reduced to fill in the same space.
   */
  getMaxLines(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number | undefined {
    return this.maxLines
  }

  /**
   * The maximum gap between the first and the last line. Use {@link maxLines} if it matches a specific number of lines.
   */
  maxLineGap?: Partial<Coordinates>

  /**
   * Function to override to provide a {@link maxLineGap} that depends on the context. Uses getMaxLines by default.
   * @param location Location to position
   * @param context Context of the game
   * @returns The maximum gap between the first and the last line.
   */
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

  countListItems(location: Location<P, L>, context: MaterialContext<P, M, L>): number {
    return Math.min(super.countListItems(location, context), this.getLineSize(location, context))
  }

  protected getCurrentMaxGap(location: Location<P, L>, context: MaterialContext<P, M, L>): XYCoordinates {
    const { x, y } = super.getCurrentMaxGap(location, context)
    const { x: gx = 0, y: gy = 0 } = this.getLineGap(location, context)
    const { x: mgx, y: mgy } = this.getMaxLineGap(location, context)
    const count = Math.min(this.limit ?? Infinity, super.countItems(location, context))
    const lineSize = this.getLineSize(location, context)
    const lines = Math.floor(count / lineSize)
    return { x: x + (mgx ?? gx * lines), y: y + (mgy ?? gy * lines) }
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
