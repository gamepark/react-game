import {
  Coordinates,
  GridBoundaries,
  HexagonalGridCoordinatesSystem,
  hexFromAxial,
  hexRotate,
  hexToAxial,
  Location,
  MaterialItem,
  MoveItem,
  XYCoordinates
} from '@gamepark/rules-api'
import isEqual from 'lodash/isEqual'
import maxBy from 'lodash/maxBy'
import minBy from 'lodash/minBy'
import omit from 'lodash/omit'
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
  abstract coordinatesSystem: HexagonalGridCoordinatesSystem

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
   * Get the delta X and Y coordinates to apply to place some area given its boundaries.
   * @param boundaries Boundaries of the location to place
   * @return X and Y delta to apply
   */
  private getAreaDelta(boundaries: Partial<GridBoundaries>): XYCoordinates {
    const { xMin = 0, xMax = 0, yMin = 0, yMax = 0 } = boundaries
    switch (this.coordinatesSystem) {
      case HexagonalGridCoordinatesSystem.Axial: {
        throw new Error('Axial HexagonalGridCoordinatesSystem is not yet implemented')
      }
      case HexagonalGridCoordinatesSystem.OddQ: {
        const deltaX = (xMin + xMax) / 2
        const deltaY = ((xMin !== xMax ? 0.5 : xMin % 2 === 0 ? 0 : 1) + yMin + yMax) / 2
        return { x: deltaX * 3 / 2 * this.sizeX, y: deltaY * Math.sqrt(3) * this.sizeY }
      }
      case HexagonalGridCoordinatesSystem.EvenQ: {
        const deltaX = (xMin + xMax) / 2
        const deltaY = ((xMin !== xMax ? -0.5 : xMin % 2 === 0 ? 0 : -1) + yMin + yMax) / 2
        return { x: deltaX * 3 / 2 * this.sizeX, y: deltaY * Math.sqrt(3) * this.sizeY }
      }
      case HexagonalGridCoordinatesSystem.OddR: {
        throw new Error('OddR HexagonalGridCoordinatesSystem is not yet implemented')
      }
      case HexagonalGridCoordinatesSystem.EvenR: {
        throw new Error('EvenR HexagonalGridCoordinatesSystem is not yet implemented')
      }
    }
  }

  /**
   * Get the coordinates for the full grid area
   * @param location Location to place
   * @param context Context of the game
   * @returns The coordinates of the area
   */
  getAreaCoordinates(location: Location<P, L>, context: MaterialContext<P, M, L>): Partial<Coordinates> {
    const { x = 0, y = 0, z } = super.getCoordinates(location, context)
    const { x: deltaX = 0, y: deltaY = 0 } = this.getAreaDelta(this.getBoundaries(location, context))
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
    let { x = 0, y = 0 } = location
    switch (this.coordinatesSystem) {
      case HexagonalGridCoordinatesSystem.Axial: {
        throw new Error('Axial HexagonalGridCoordinatesSystem is not yet implemented')
      }
      case HexagonalGridCoordinatesSystem.OddQ: {
        if (x % 2 !== 0) y += 0.5
        return {
          x: x * 3 / 2 * this.sizeX,
          y: y * Math.sqrt(3) * this.sizeY
        }
      }
      case HexagonalGridCoordinatesSystem.EvenQ: {
        if (x % 2 !== 0) y -= 0.5
        return {
          x: x * 3 / 2 * this.sizeX,
          y: y * Math.sqrt(3) * this.sizeY
        }
      }
      case HexagonalGridCoordinatesSystem.OddR: {
        throw new Error('OddR HexagonalGridCoordinatesSystem is not yet implemented')
      }
      case HexagonalGridCoordinatesSystem.EvenR: {
        throw new Error('EvenR HexagonalGridCoordinatesSystem is not yet implemented')
      }
    }
  }

  /**
   * Get the coordinates of an item on the grid. If the item is a Polyhex, the shape will be use to center the origin coordinates of the item on the
   * correct grid location.
   * @param item Item to place
   * @param context Context of the game
   * @return the coordinates of the item
   */
  getItemCoordinates(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): Partial<Coordinates> {
    const description = context.material[context.type]
    if (description && isPolyhexDescription<P, M, L>(description)) {
      const shape = description.getPolyhexShape(item, context).map(hex =>
        hexFromAxial(
          hexRotate(
            hexToAxial(hex, description.coordinatesSystem),
            item.location.rotation
          ),
          this.coordinatesSystem)
      )
      const xMin = minBy(shape, 'x')?.x, xMax = maxBy(shape, 'x')?.x, yMin = minBy(shape, 'y')?.y, yMax = maxBy(shape, 'y')?.y
      const { x = 0, y = 0, z } = super.getItemCoordinates(item, context)
      const { x: deltaX = 0, y: deltaY = 0 } = this.getAreaDelta({ xMin, xMax, yMin, yMax })
      return { x: x + deltaX, y: y + deltaY, z }
    }
    return super.getItemCoordinates(item, context)
  }

  /**
   * Rotate the item. On a hexagonal grid, by default the item's rotation is multiplied by 60 degrees.
   * @param item Item to rotate
   * @param _context Context of the item
   * @return the item's rotation in degrees
   */
  getItemRotateZ(item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): number {
    return (item.location.rotation ?? 0) * 60
  }

  /**
   * Returns the drop locations for current dragged item. The hexagonal grid must be one simple drop location.
   */
  getDropLocations(moves: MoveItem<P, M, L>[], _context: ItemContext<P, M, L>): Location<P, L>[] {
    return uniqWith(moves.map(move => (omit(move.location, ['x', 'y', 'z', 'rotation']) as Location<P, L>)), isEqual)
  }

  /**
   * Generate automatically a {@link HexGridDropAreaDescription} based on the grid boundaries
   */
  getLocationDescription(location: Location<P, L>, context: MaterialContext<P, M, L> | ItemContext<P, M, L>): LocationDescription<P, M, L> | undefined {
    if (this.locationDescription) return this.locationDescription
    const { xMin = 0, xMax = 0, yMin = 0, yMax = 0 } = this.getBoundaries(location, context)
    const borderRadius = this.sizeX / 3
    switch (this.coordinatesSystem) {
      case HexagonalGridCoordinatesSystem.Axial: {
        throw new Error('Axial HexagonalGridCoordinatesSystem is not yet implemented')
      }
      case HexagonalGridCoordinatesSystem.OddQ:
      case HexagonalGridCoordinatesSystem.EvenQ:
        return new HexGridDropAreaDescription({
          width: (xMax - xMin + 1) * 3 / 2 * this.sizeX,
          height: (yMax - yMin + 1) * Math.sqrt(3) * this.sizeY,
          borderRadius
        })
      case HexagonalGridCoordinatesSystem.OddR: {
        throw new Error('OddR HexagonalGridCoordinatesSystem is not yet implemented')
      }
      case HexagonalGridCoordinatesSystem.EvenR: {
        throw new Error('EvenR HexagonalGridCoordinatesSystem is not yet implemented')
      }
    }
  }
}
