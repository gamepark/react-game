import { Coordinates, Location, MaterialItem, XYCoordinates } from '@gamepark/rules-api'
import { DropAreaDescription, LocationDescription } from '../components'
import { ItemContext, Locator, MaterialContext } from './Locator'

export class ListLocator<P extends number = number, M extends number = number, L extends number = number> extends Locator<P, M, L> {

  constructor(clone?: Partial<ListLocator>) {
    super()
    Object.assign(this, clone)
  }

  gap?: Partial<Coordinates>

  getGap(_location: Location<P, L>, _context: MaterialContext<P, M, L>): Partial<Coordinates> {
    return this.gap ?? {}
  }

  maxGap?: Partial<Coordinates>

  getMaxGap(location: Location<P, L>, context: MaterialContext<P, M, L>): Partial<Coordinates> {
    if (this.maxGap) return this.maxGap
    const maxCount = this.getMaxCount(location, context)
    if (maxCount === undefined) return {}
    const { x, y, z } = this.getGap(location, context)
    return {
      x: x ? x * (maxCount - 1) : x,
      y: y ? y * (maxCount - 1) : y,
      z: z ? z * (maxCount - 1) : z
    }
  }

  maxCount?: number

  getMaxCount(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number | undefined {
    return this.maxCount
  }

  countListItems(location: Location<P, L>, context: MaterialContext<P, M, L>): number {
    return Math.min(this.limit ?? Infinity, this.countItems(location, context))
  }

  getAreaCoordinates(location: Location<P, L>, context: MaterialContext<P, M, L>): Partial<Coordinates> {
    const { x = 0, y = 0, z = 0 } = this.getCoordinates(location, context)
    const { x: mx, y: my } = this.getCurrentMaxGap(location, context)
    return { x: x + mx / 2, y: y + my / 2, z }
  }

  protected getCurrentMaxGap(location: Location<P, L>, context: MaterialContext<P, M, L>): XYCoordinates {
    const { x: gx = 0, y: gy = 0 } = this.getGap(location, context)
    const { x: mgx, y: mgy } = this.getMaxGap(location, context)
    const count = this.countListItems(location, context)
    return { x: (mgx ?? gx * (count - 1)), y: (mgy ?? gy * (count - 1)) }
  }

  getLocationCoordinates(location: Location<P, L>, context: MaterialContext<P, M, L>,
                         index = this.getLocationIndex(location, context)): Partial<Coordinates> {
    if (index === undefined) return this.getAreaCoordinates(location, context)
    const { x = 0, y = 0, z = 0 } = this.getCoordinates(location, context)
    const { x: gx = 0, y: gy = 0, z: gz = 0.05 } = this.getGap(location, context)
    const { x: mgx, y: mgy, z: mgz } = this.getMaxGap(location, context)
    const count = this.countListItems(location, context)
    return {
      x: x + index * (mgx && count > 1 ? mgx * Math.min(gx / mgx, 1 / (count - 1)) : gx),
      y: y + index * (mgy && count > 1 ? mgy * Math.min(gy / mgy, 1 / (count - 1)) : gy),
      z: z + index * (mgz && count > 1 ? mgz * Math.min(gz / mgz, 1 / (count - 1)) : gz)
    }
  }

  getDeltaValue(delta: number = 0, max: number | undefined, count: number) {
    if (max !== undefined && max > 0) return Math.min(delta, max / (count - 1))
    if (max !== undefined && max < 0) return Math.max(delta, max / (count - 1))
    return delta
  }

  getItemCoordinates(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): Partial<Coordinates> {
    return this.getLocationCoordinates(item.location, context, this.getItemIndex(item, context))
  }

  protected generateLocationDescriptionFromDraggedItem(location: Location<P, L>, context: ItemContext<P, M, L>): LocationDescription<P, M, L> | undefined {
    const item = context.rules.material(context.type).getItem(context.index)
    if (!item) return
    const { width = 0, height = 0 } = context.material[context.type]?.getSize(item.id) ?? {}
    const { x, y } = this.getCurrentMaxGap(location, context)
    const borderRadius = context.material[context.type]?.getBorderRadius(item.id) ?? 0
    return new DropAreaDescription({
      width: width + Math.abs(x),
      height: height + Math.abs(y),
      borderRadius
    })
  }
}