import { Coordinates, Location, MaterialItem, MoveItem, Polyomino, XYCoordinates } from '@gamepark/rules-api'
import { isEqual, omit, uniqWith } from 'es-toolkit'
import { isPolyominoDescription, LocationDescription, SquareGridDropAreaDescription } from '../components'
import { ItemContext, Locator, MaterialContext } from './Locator'

/**
 * This locator is responsible for placing locations and items on a square grid (for Polyominoes).
 */
export abstract class SquareGridLocator<P extends number = number, M extends number = number, L extends number = number, T = any, R extends number = number, V extends number = number> extends Locator<P, M, L, R, V> {
  /**
   * The size of one square cell (width and height, in em). For non-square cells, the size can use XY values.
   */
  abstract size: number | XYCoordinates

  /**
   * Horizontal size of a cell
   */
  protected get sizeX() {
    return typeof this.size === 'number' ? this.size : this.size.x
  }

  /**
   * Vertical size of a cell
   */
  protected get sizeY() {
    return typeof this.size === 'number' ? this.size : this.size.y
  }

  /**
   * Polyomino of the drop area
   */
  dropArea?: Polyomino<T>

  /**
   * Override if you need a dynamic drop area
   * @param _location The location to consider
   * @param _context Context of the game
   * @return the current drop area
   */
  getDropArea(_location: Location<P, L>, _context: MaterialContext<P, M, L, R, V>): Polyomino<T> | undefined {
    return this.dropArea
  }

  /**
   * Get the coordinates for the full grid area
   * @param location Location to place
   * @param context Context of the game
   * @returns The coordinates of the area
   */
  getAreaCoordinates(location: Location<P, L>, context: MaterialContext<P, M, L, R, V>): Partial<Coordinates> {
    const { x = 0, y = 0, z } = this.getCoordinates(location, context)
    const dropArea = this.getDropArea(location, context)
    if (!dropArea) return { x, y, z }
    const { xMin, xMax, yMin, yMax } = this.getBoundaries(dropArea)
    return { x: (xMin + xMax) / 2, y: (yMin + yMax) / 2, z }
  }

  /**
   * Get the coordinates of a location on the grid
   * @param location Location to place
   * @param context Context of the game
   * @return the coordinates
   */
  getLocationCoordinates(location: Location<P, L>, context: MaterialContext<P, M, L, R, V>): Partial<Coordinates> {
    if (location.x === undefined && location.y === undefined) {
      return this.getAreaCoordinates(location, context)
    }
    const { x: baseX = 0, y: baseY = 0, z: baseZ } = this.getCoordinates(location, context)
    const { x = 0, y = 0 } = this.getSquarePosition(location)
    return { x: baseX + x, y: baseY + y, z: baseZ }
  }

  /**
   * Get the position of a square cell
   * @param coordinates Coordinates of the cell
   * @return coordinates to place the cell on the location
   */
  getSquarePosition(coordinates: Partial<XYCoordinates>): XYCoordinates {
    const { x = 0, y = 0 } = coordinates
    return { x: x * this.sizeX, y: y * this.sizeY }
  }

  /**
   * Get the coordinates of an item on the grid. If the item is a Polyomino, the shape will be used to center the origin coordinates of the item on the
   * correct grid location.
   * @param item Item to place
   * @param context Context of the game
   * @return the coordinates of the item
   */
  getItemCoordinates(item: MaterialItem<P, L>, context: ItemContext<P, M, L, R, V>): Partial<Coordinates> {
    const { x = 0, y = 0, z } = super.getItemCoordinates(item, context)
    const description = context.material[context.type]
    if (!description || !isPolyominoDescription<P, M, L, any, R, V>(description)) {
      return { x, y, z }
    }
    const polyomino = description.getPolyomino(item, context)
    const { xMax, xMin, yMin, yMax } = this.getBoundaries(polyomino)
    const { x: deltaX, y: deltaY } = rotateVector({ x: (xMin + xMax) / 2, y: (yMin + yMax) / 2 }, this.getItemRotateZ(item, context))
    return { x: x + deltaX, y: y + deltaY, z }
  }

  /**
   * Rotate the location. On a square grid, by default the rotation is expected to be [0, 3] and it is multiplied by 90 degrees.
   * @param location Location to rotate
   * @param _context Context of the item
   * @return the location's rotation in degrees
   */
  getRotateZ(location: Location<P, L>, _context: MaterialContext<P, M, L, R, V>): number {
    return typeof location.rotation === 'number' ? location.rotation * 90 : 0
  }

  /**
   * Returns the drop locations for current dragged item. The square grid must be one simple drop location.
   */
  getDropLocations(moves: MoveItem<P, M, L>[], context: ItemContext<P, M, L, R, V>): Location<P, L>[] {
    if (!this.locationDescription || this.locationDescription.ignoreCoordinates) {
      return uniqWith(moves.map(move => (omit(move.location, ['x', 'y', 'z', 'rotation']) as Location<P, L>)), isEqual)
    } else {
      return super.getDropLocations(moves, context)
    }
  }

  dropPreview = true

  /**
   * Generate automatically a {@link SquareGridDropAreaDescription} based on the grid boundaries
   */
  getLocationDescription(location: Location<P, L>, context: MaterialContext<P, M, L, R, V> | ItemContext<P, M, L, R, V>): LocationDescription<P, M, L> | undefined {
    if (this.locationDescription) return this.locationDescription
    if (location.x !== undefined || location.y !== undefined) return super.getLocationDescription(location, context)
    const dropArea = this.getDropArea(location, context)
    if (!dropArea) return super.getLocationDescription(location, context)
    const { xMin, xMax, yMin, yMax } = this.getBoundaries(dropArea)
    const borderRadius = this.sizeX / 10
    return new SquareGridDropAreaDescription({
      width: xMax - xMin,
      height: yMax - yMin,
      borderRadius
    })
  }

  /**
   * Compute the boundaries of a polyomino, in em (relative to the grid origin). Empty cells on the edges are ignored.
   * @param polyomino The polyomino to measure
   * @return the boundaries in em
   */
  getBoundaries(polyomino: Polyomino<T>) {
    const boundaries = { xMin: 0, xMax: 0, yMin: 0, yMax: 0 }
    if (!polyomino) {
      return boundaries
    }
    let xMinCell = Infinity, xMaxCell = -Infinity, yMinCell = Infinity, yMaxCell = -Infinity
    for (let y = polyomino.yMin; y <= polyomino.yMax; y++) {
      for (let x = polyomino.xMin; x <= polyomino.xMax; x++) {
        if (!polyomino.isEmpty(polyomino.getValue({ x, y }))) {
          if (x < xMinCell) xMinCell = x
          if (x > xMaxCell) xMaxCell = x
          if (y < yMinCell) yMinCell = y
          if (y > yMaxCell) yMaxCell = y
        }
      }
    }
    if (xMinCell === Infinity) {
      return boundaries
    }
    boundaries.xMin = xMinCell * this.sizeX - this.sizeX / 2
    boundaries.xMax = xMaxCell * this.sizeX + this.sizeX / 2
    boundaries.yMin = yMinCell * this.sizeY - this.sizeY / 2
    boundaries.yMax = yMaxCell * this.sizeY + this.sizeY / 2
    return boundaries
  }
}

function rotateVector(vector: XYCoordinates, degrees: number) {
  const rad = degrees * (Math.PI / 180)
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return {
    x: Math.round(10000 * (vector.x * cos - vector.y * sin)) / 10000,
    y: Math.round(10000 * (vector.x * sin + vector.y * cos)) / 10000
  }
}
