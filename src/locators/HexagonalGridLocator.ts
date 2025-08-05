import { Coordinates, HexGridSystem, Location, MaterialItem, MoveItem, Polyhex, XYCoordinates } from '@gamepark/rules-api'
import findLastIndex from 'lodash/findLastIndex'
import isEqual from 'lodash/isEqual'
import omit from 'lodash/omit'
import uniqWith from 'lodash/uniqWith'
import { HexGridDropAreaDescription, isPolyhexDescription, LocationDescription } from '../components'
import { ItemContext, Locator, MaterialContext } from './Locator'

/**
 * This locator is responsible for placing locations and items on a hexagonal grid.
 */
export abstract class HexagonalGridLocator<P extends number = number, M extends number = number, L extends number = number, T = any> extends Locator<P, M, L> {
  /**
   * The coordinates system used by the location and items to place
   */
  abstract coordinatesSystem: HexGridSystem

  /**
   * When using Axial coordinates system, you must specify the hexagons orientation
   */
  orientation?: 'flat' | 'pointy'

  /**
   * The size of one hexagon, i.e. the distance between the center of the hexagon and its vertices.
   * For irregular hexagons, the distance can use XY values.
   */
  abstract size: number | XYCoordinates // distance from center to vertices

  /**
   * Horizontal size of a hexagon
   */
  protected get sizeX() {
    return typeof this.size === 'number' ? this.size : this.size.x
  }

  /**
   * Vertical size of a hexagon
   */
  protected get sizeY() {
    return typeof this.size === 'number' ? this.size : this.size.y
  }

  /**
   * Polyhex of the drop area
   */
  dropArea?: Polyhex<T>

  /**
   * Override if you need a dynamic drop area
   * @param _location The location to consider
   * @param _context Context of the game
   * @return the current drop area
   */
  getDropArea(_location: Location<P, L>, _context: MaterialContext<P, M, L>): Polyhex<T> | undefined {
    return this.dropArea
  }

  /**
   * Get the coordinates for the full grid area
   * @param location Location to place
   * @param context Context of the game
   * @returns The coordinates of the area
   */
  getAreaCoordinates(location: Location<P, L>, context: MaterialContext<P, M, L>): Partial<Coordinates> {
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
  getLocationCoordinates(location: Location<P, L>, context: MaterialContext<P, M, L>): Partial<Coordinates> {
    if (location.x === undefined && location.y === undefined) {
      return this.getAreaCoordinates(location, context)
    }
    const { x: baseX = 0, y: baseY = 0, z: baseZ } = this.getCoordinates(location, context)
    const { x = 0, y = 0 } = this.getHexagonPosition(location)
    return { x: baseX + x, y: baseY + y, z: baseZ }
  }

  /**
   * Get the position of a hexagon
   * @param coordinates Coordinates of the hexagon
   * @param coordinatesSystem System of coordinates to consider
   * @return coordinates to place the hexagon on the location
   */
  getHexagonPosition(coordinates: Partial<XYCoordinates>, coordinatesSystem = this.coordinatesSystem): XYCoordinates {
    let { x = 0, y = 0 } = coordinates
    switch (coordinatesSystem) {
      case HexGridSystem.Axial: {
        return {
          x: (x * Math.sqrt(3) + y * Math.sqrt(3) / 2) * this.sizeX,
          y: y * 3 / 2 * this.sizeY
        }
      }
      case HexGridSystem.OddQ: {
        y += ((x % 2 + 2) % 2) / 2
        return {
          x: x * 3 / 2 * this.sizeX,
          y: y * Math.sqrt(3) * this.sizeY
        }
      }
      case HexGridSystem.EvenQ: {
        y -= ((x % 2 + 2) % 2) / 2
        return {
          x: x * 3 / 2 * this.sizeX,
          y: y * Math.sqrt(3) * this.sizeY
        }
      }
      case HexGridSystem.OddR: {
        throw new Error('OddR HexGridSystem is not yet implemented')
      }
      case HexGridSystem.EvenR: {
        throw new Error('EvenR HexGridSystem is not yet implemented')
      }
    }
  }

  /**
   * Get the coordinates of an item on the grid. If the item is a Polyhex, the shape will be used to center the origin coordinates of the item on the
   * correct grid location.
   * @param item Item to place
   * @param context Context of the game
   * @return the coordinates of the item
   */
  getItemCoordinates(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): Partial<Coordinates> {
    const { x = 0, y = 0, z } = super.getItemCoordinates(item, context)
    const description = context.material[context.type]
    if (!description || !isPolyhexDescription<P, M, L>(description)) {
      return { x, y, z }
    }
    const polyhex = description.getPolyhex(item, context)
    const { xMax, xMin, yMin, yMax } = this.getBoundaries(polyhex)
    const { x: deltaX, y: deltaY } = rotateVector({ x: (xMin + xMax) / 2, y: (yMin + yMax) / 2 }, item.location.rotation * 60)
    return { x: x + deltaX, y: y + deltaY, z }
  }

  /**
   * Rotate the location. On a hexagonal grid, by default the rotation is expected to be [0, 5] and it is multiplied by 60 degrees.
   * @param location Location to rotate
   * @param _context Context of the item
   * @return the location's rotation in degrees
   */
  getRotateZ(location: Location<P, L>, _context: MaterialContext<P, M, L>): number {
    return (location.rotation ?? 0) * 60
  }

  /**
   * Returns the drop locations for current dragged item. The hexagonal grid must be one simple drop location.
   */
  getDropLocations(moves: MoveItem<P, M, L>[], context: ItemContext<P, M, L>): Location<P, L>[] {
    if (!this.locationDescription || this.locationDescription.ignoreCoordinates) {
      return uniqWith(moves.map(move => (omit(move.location, ['x', 'y', 'z', 'rotation']) as Location<P, L>)), isEqual)
    } else {
      return super.getDropLocations(moves, context)
    }
  }

  dropPreview = true

  /**
   * Generate automatically a {@link HexGridDropAreaDescription} based on the grid boundaries
   */
  getLocationDescription(location: Location<P, L>, context: MaterialContext<P, M, L> | ItemContext<P, M, L>): LocationDescription<P, M, L> | undefined {
    if (this.locationDescription) return this.locationDescription
    if (location.x !== undefined || location.y !== undefined) return super.getLocationDescription(location, context)
    const dropArea = this.getDropArea(location, context)
    if (!dropArea) return super.getLocationDescription(location, context)
    const { xMin, xMax, yMin, yMax } = this.getBoundaries(dropArea)
    const borderRadius = this.sizeX / 3
    return new HexGridDropAreaDescription({
      width: xMax - xMin,
      height: yMax - yMin,
      borderRadius
    })
  }

  getBoundaries(polyhex: Polyhex<T>) {
    const boundaries = { xMin: 0, xMax: 0, yMin: 0, yMax: 0 }
    if (!polyhex) {
      return boundaries
    }
    switch (polyhex.system) {
      case HexGridSystem.Axial: {
        if (!this.orientation) {
          throw new Error('You must specify the orientation (flat or pointy) when using the Axial HexGridSystem')
        } else if (this.orientation === 'flat') {
          boundaries.xMin = polyhex.xMin * 3 / 2 * this.sizeX - this.sizeX
          boundaries.xMax = polyhex.xMax * 3 / 2 * this.sizeX + this.sizeX
          boundaries.yMin = Math.min(...polyhex.grid.map((line, index) => {
            const xMin = boundaries.xMin + line.findIndex((value) => !polyhex.isEmpty(value))
            return (boundaries.yMin + index + xMin / 2) * Math.sqrt(3) * this.sizeY
          }))
          boundaries.yMax = Math.max(...polyhex.grid.map((line, index) => {
            const xMax = boundaries.xMax + findLastIndex(line, (value) => !polyhex.isEmpty(value))
            return (boundaries.yMax + index + xMax / 2) * Math.sqrt(3) * this.sizeY
          }))
        } else {
          throw new Error('Axial HexGridSystem for pointy top orientation is not yet implemented')
        }
        break
      }
      case HexGridSystem.OddQ:
      case HexGridSystem.EvenQ: {
        boundaries.xMin = polyhex.xMin * 3 / 2 * this.sizeX - this.sizeX
        const xMax = Math.max(...polyhex.grid.map((line) => line.length)) - 1
        boundaries.xMax = (xMax + polyhex.xMin) * 3 / 2 * this.sizeX + this.sizeX
        const swapSystem = polyhex.xMin % 2 !== 0
        let yMin = polyhex.yMin - 0.5
        const firstLine = polyhex.grid[0]
        if (polyhex.system === HexGridSystem.OddQ && firstLine.every((value, y) => polyhex.isEmpty(value) || (swapSystem ? !(y % 2) : y % 2))) {
          yMin += 0.5
        } else if (polyhex.system === HexGridSystem.EvenQ && firstLine.some((value, y) => !polyhex.isEmpty(value) && (swapSystem ? !(y % 2) : y % 2))) {
          yMin -= 0.5
        }
        boundaries.yMin = yMin * Math.sqrt(3) * this.sizeY
        let yMax = polyhex.grid.length + polyhex.yMin - 0.5
        const lastLine = polyhex.grid[polyhex.grid.length - 1]
        if (polyhex.system === HexGridSystem.OddQ && lastLine.some((value, y) => !polyhex.isEmpty(value) && (swapSystem ? !(y % 2) : y % 2))) {
          yMax += 0.5
        } else if (polyhex.system === HexGridSystem.EvenQ && lastLine.every((value, y) => polyhex.isEmpty(value) || (swapSystem ? !(y % 2) : y % 2))) {
          yMax -= 0.5
        }
        boundaries.yMax = yMax * Math.sqrt(3) * this.sizeY
        break
      }
      case HexGridSystem.OddR: {
        throw new Error('OddR HexGridSystem is not yet implemented')
      }
      case HexGridSystem.EvenR: {
        throw new Error('EvenR HexGridSystem is not yet implemented')
      }
    }
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
