import { Coordinates, Location, MaterialItem } from '@gamepark/rules-api'
import { ItemContext, Locator, MaterialContext } from './Locator'

export abstract class FlexLocator<P extends number = number, M extends number = number, L extends number = number> extends Locator<P, M, L> {
  abstract itemsPerLine: number
  abstract itemsGap: Partial<Coordinates>
  abstract linesGap: Partial<Coordinates>
  maxLinesGap?: Partial<Coordinates>

  getOriginCoordinates(_location: Location<P, L>, _context: MaterialContext<P, M, L>): Partial<Coordinates> {
    return this.coordinates
  }

  getLocationCoordinates(location: Location<P, L>, context: MaterialContext<P, M, L>,
                         index = this.getLocationIndex(location, context) ?? 0): Coordinates {
    const { x = 0, y = 0, z = 0 } = this.getOriginCoordinates(location, context)
    const itemIndex = index % this.itemsPerLine
    const lineIndex = Math.floor(index / this.itemsPerLine)
    const lineGap = this.getLinesGap(location, context)
    return {
      x: x + itemIndex * (this.itemsGap.x ?? 0) + lineIndex * (lineGap.x ?? 0),
      y: y + itemIndex * (this.itemsGap.y ?? 0) + lineIndex * (lineGap.y ?? 0),
      z: z + itemIndex * (this.itemsGap.z ?? 0) + lineIndex * (lineGap.z ?? 0)
    }
  }

  getItemCoordinates(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): Coordinates {
    return this.getLocationCoordinates(item.location, context, this.getItemIndex(item, context))
  }

  getLinesGap(location: Location<P, L>, context: MaterialContext<P, M, L>): Partial<Coordinates> {
    if (!this.maxLinesGap) return this.linesGap
    const count = this.countItems(location, context)
    const lines = Math.floor(count / this.itemsPerLine)
    const { x = 0, y = 0, z = 0 } = this.linesGap
    return {
      x: this.maxLinesGap.x && Math.abs(this.maxLinesGap.x) / lines < Math.abs(x) ? this.maxLinesGap.x / lines : x,
      y: this.maxLinesGap.y && Math.abs(this.maxLinesGap.y) / lines < Math.abs(y) ? this.maxLinesGap.y / lines : y,
      z: this.maxLinesGap.z && Math.abs(this.maxLinesGap.z) / lines < Math.abs(z) ? this.maxLinesGap.z / lines : z
    }
  }
}
