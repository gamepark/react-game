import { Coordinates, MaterialItem } from '@gamepark/rules-api'
import { ItemContext, ItemLocator } from './ItemLocator'

export abstract class GridLocator<P extends number = number, M extends number = number, L extends number = number> extends ItemLocator<P, M, L> {
  reverse = false
  coordinates: Coordinates = { x: 0, y: 0, z: 0 }
  abstract itemsPerLine: number
  abstract itemsGap: Partial<Coordinates>
  abstract linesGap: Partial<Coordinates>
  maxLinesGap?: Partial<Coordinates>

  getPosition(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): Coordinates {
    const { x, y, z } = this.getCoordinates(item, context)
    const index = this.getItemIndex(item, context)
    const itemIndex = index % this.itemsPerLine
    const lineIndex = Math.floor(index / this.itemsPerLine)
    const lineGap = this.getLinesGap(item, context)
    return {
      x: x + itemIndex * (this.itemsGap.x ?? 0) + lineIndex * (lineGap.x ?? 0),
      y: y + itemIndex * (this.itemsGap.y ?? 0) + lineIndex * (lineGap.y ?? 0),
      z: z + itemIndex * (this.itemsGap.z ?? 0) + lineIndex * (lineGap.z ?? 0)
    }
  }

  getCoordinates(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): Coordinates {
    return this.coordinates
  }

  getLinesGap(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): Partial<Coordinates> {
    if (!this.maxLinesGap) return this.linesGap
    const count = this.countItems(item.location, context)
    const lines = Math.floor(count / this.itemsPerLine)
    const { x = 0, y = 0, z = 0 } = this.linesGap
    return {
      x: this.maxLinesGap.x && Math.abs(this.maxLinesGap.x) / lines < Math.abs(x) ? this.maxLinesGap.x / lines : x,
      y: this.maxLinesGap.y && Math.abs(this.maxLinesGap.y) / lines < Math.abs(y) ? this.maxLinesGap.y / lines : y,
      z: this.maxLinesGap.z && Math.abs(this.maxLinesGap.z) / lines < Math.abs(z) ? this.maxLinesGap.z / lines : z
    }
  }
}
