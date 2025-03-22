import {
  Coordinates,
  GridBoundaries,
  hexFromAxial,
  HexGridSystem,
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
   * Get the delta X and Y coordinates to apply to place some area given its boundaries.
   * @param boundaries Boundaries of the location to place
   * @return X and Y delta to apply
   */
  private getAreaDelta(boundaries: Partial<GridBoundaries>): XYCoordinates {
    const { xMin = 0, xMax = 0, yMin = 0, yMax = 0 } = boundaries
    switch (this.coordinatesSystem) {
      case HexGridSystem.Axial: {
        return { x: 0, y: 0 }
        // throw new Error('Axial HexGridSystem is not yet implemented')
      }
      case HexGridSystem.OddQ: {
        const deltaX = (xMin + xMax) / 2
        const deltaY = ((xMin !== xMax ? 0.5 : xMin % 2 === 0 ? 0 : 1) + yMin + yMax) / 2
        return { x: deltaX * 3 / 2 * this.sizeX, y: deltaY * Math.sqrt(3) * this.sizeY }
      }
      case HexGridSystem.EvenQ: {
        const deltaX = (xMin + xMax) / 2
        const deltaY = ((xMin !== xMax ? -0.5 : xMin % 2 === 0 ? 0 : -1) + yMin + yMax) / 2
        return { x: deltaX * 3 / 2 * this.sizeX, y: deltaY * Math.sqrt(3) * this.sizeY }
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
   * Get the coordinates for the full grid area
   * @param location Location to place
   * @param context Context of the game
   * @returns The coordinates of the area
   */
  getAreaCoordinates(location: Location<P, L>, context: MaterialContext<P, M, L>): Partial<Coordinates> {
    const { x = 0, y = 0, z } = this.getCoordinates(location, context)
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
    const { x: baseX = 0, y: baseY = 0, z: baseZ } = this.getCoordinates(location, context)
    let { x = 0, y = 0 } = location
    switch (this.coordinatesSystem) {
      case HexGridSystem.Axial: {
        return {
          x: baseX + (x * Math.sqrt(3) + y * Math.sqrt(3) / 2) * this.sizeX,
          y: baseY + y * 3 / 2 * this.sizeY,
          z: baseZ
        }
      }
      case HexGridSystem.OddQ: {
        y += ((x % 2 + 2) % 2) / 2
        return {
          x: baseX + x * 3 / 2 * this.sizeX,
          y: baseY + y * Math.sqrt(3) * this.sizeY,
          z: baseZ
        }
      }
      case HexGridSystem.EvenQ: {
        y -= ((x % 2 + 2) % 2) / 2
        return {
          x: baseX + x * 3 / 2 * this.sizeX,
          y: baseY + y * Math.sqrt(3) * this.sizeY,
          z: baseZ
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
