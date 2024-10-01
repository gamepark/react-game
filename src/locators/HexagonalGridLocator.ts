import { Coordinates, Location, MoveItem, XYCoordinates } from '@gamepark/rules-api'
import isEqual from 'lodash/isEqual'
import omit from 'lodash/omit'
import uniqWith from 'lodash/uniqWith'
import { ItemContext, Locator, MaterialContext } from './Locator'

export enum HexagonalGridCoordinatesSystem {
  Cube, OddQ, EvenQ, OddR, EvenR
}

export abstract class HexagonalGridLocator<P extends number = number, M extends number = number, L extends number = number> extends Locator<P, M, L> {
  abstract coordinatesSystem: HexagonalGridCoordinatesSystem

  abstract size: number | XYCoordinates // distance from center to vertices

  get sizeX() {
    return typeof this.size === 'number' ? this.size : this.size.x
  }

  get sizeY() {
    return typeof this.size === 'number' ? this.size : this.size.y
  }

  getAreaCoordinates(location: Location<P, L>, context: MaterialContext<P, M, L>): Partial<Coordinates> {
    return super.getCoordinates(location, context)
  }

  getLocationCoordinates(location: Location<P, L>, context: MaterialContext<P, M, L>): Partial<Coordinates> {
    if (location.x === undefined || location.y === undefined) {
      return this.getAreaCoordinates(location, context)
    }
    switch (this.coordinatesSystem) {
      case HexagonalGridCoordinatesSystem.Cube: {
        throw new Error('Cube HexagonalGridCoordinatesSystem is not yet implemented')
      }
      case HexagonalGridCoordinatesSystem.OddQ: {
        const y = location.x % 2 === 0 ? location.y : location.y + 0.5
        return {
          x: location.x * 3 / 2 * this.sizeX,
          y: y * Math.sqrt(3) * this.sizeY
        }
      }
      case HexagonalGridCoordinatesSystem.EvenQ: {
        const y = location.x % 2 === 0 ? location.y : location.y - 0.5
        return {
          x: location.x * 3 / 2 * this.sizeX,
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

  getDropLocations(moves: MoveItem<P, M, L>[], _context: ItemContext<P, M, L>): Location<P, L>[] {
    return uniqWith(moves.map(move => (omit(move.location, ['x', 'y', 'z', 'rotation']) as Location<P, L>)), isEqual)
  }
}
