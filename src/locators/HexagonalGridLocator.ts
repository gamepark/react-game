import { Coordinates, GridBoundaries, HexGridSystem, Location, MaterialItem, MoveItem, XYCoordinates } from '@gamepark/rules-api'
import isEqual from 'lodash/isEqual'
import maxBy from 'lodash/maxBy'
import minBy from 'lodash/minBy'
import omit from 'lodash/omit'
import range from 'lodash/range'
import uniqWith from 'lodash/uniqWith'
import { HexGridDropAreaDescription, isPolyhexDescription, LocationDescription } from '../components'
import { ItemContext, Locator, MaterialContext } from './Locator'

/**
 * This locator is responsible for placing locations and items on a hexagonal grid.
 */
export abstract class HexagonalGridLocator<P extends number = number, M extends number = number, L extends number = number> extends Locator<P, M, L> {
  /**
   * The coordinates system used by the location and items to place
   */
  abstract coordinatesSystem: HexGridSystem

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
   * The min and max X and Y coordinates of the grid, if any.
   * Define the boundaries to get the drop area automatically sized and centered.
   */
  boundaries: Partial<GridBoundaries> = {}

  /**
   * Override if you need dynamic {@link boundaries}.
   * @param _location The location to consider
   * @param _context Context of the game
   * @return current grid boundaries
   */
  getBoundaries(_location: Location<P, L>, _context: MaterialContext<P, M, L>): Partial<GridBoundaries> {
    return this.boundaries
  }

  /**
   * Based on the coordinates of each hexagon in an area, return the delta coordinates to place the area properly
   * @param polyhex Matrix representing the polyhex. Falsy values will be considered are blank spots
   * @param coordinatesSystem System of coordinates to consider
   * @return delta x and y to apply to the position of the area
   */
  getPolyhexDelta<T = any>(polyhex: T[][], coordinatesSystem = this.coordinatesSystem): XYCoordinates {
    const areaCoordinates = polyhex.flatMap((line, y) => line.flatMap((value, x) => !!value ? [{ x, y }] : []))
    const areaDeltaCoordinates = areaCoordinates.map((coordinates) => this.getHexagonPosition(coordinates, coordinatesSystem))
    const xMin = minBy(areaDeltaCoordinates, 'x')?.x ?? 0
    const xMax = maxBy(areaDeltaCoordinates, 'x')?.x ?? 0
    const yMin = minBy(areaDeltaCoordinates, 'y')?.y ?? 0
    const yMax = maxBy(areaDeltaCoordinates, 'y')?.y ?? 0
    return { x: (xMin + xMax) / 2, y: (yMin + yMax) / 2 }
  }

  /**
   * Get the coordinates for the full grid area
   * @param location Location to place
   * @param context Context of the game
   * @returns The coordinates of the area
   */
  getAreaCoordinates(location: Location<P, L>, context: MaterialContext<P, M, L>): Partial<Coordinates> {
    const { x = 0, y = 0, z } = this.getCoordinates(location, context)
    const { xMax = 0, xMin = 0, yMax = 0, yMin = 0 } = this.getBoundaries(location, context)
    const polyhex = range(yMin, yMax + 1).map((_) => range(xMin, xMax + 1).map((_) => true))
    const { x: deltaX, y: deltaY } = this.getPolyhexDelta(polyhex)
    return { x: x + deltaX, y: y + deltaY, z }
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
    const shape = description.getPolyhexShape(item, context)
    const areaDelta = this.getPolyhexDelta(shape, description.coordinatesSystem)
    const { x: deltaX, y: deltaY } = rotateVector(areaDelta, item.location.rotation * 60)
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
    const { xMin = 0, xMax = 0, yMin = 0, yMax = 0 } = this.getBoundaries(location, context)
    const borderRadius = this.sizeX / 3
    switch (this.coordinatesSystem) {
      case HexGridSystem.Axial: {
        throw new Error('Axial HexGridSystem is not yet implemented')
      }
      case HexGridSystem.OddQ:
      case HexGridSystem.EvenQ:
        return new HexGridDropAreaDescription({
          width: (xMax - xMin + 1) * 3 / 2 * this.sizeX,
          height: (yMax - yMin + 1) * Math.sqrt(3) * this.sizeY,
          borderRadius
        })
      case HexGridSystem.OddR: {
        throw new Error('OddR HexGridSystem is not yet implemented')
      }
      case HexGridSystem.EvenR: {
        throw new Error('EvenR HexGridSystem is not yet implemented')
      }
    }
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
