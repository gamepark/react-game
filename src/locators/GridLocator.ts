import { Coordinates, isSameLocationArea, Location } from '@gamepark/rules-api'
import { Locator, MaterialContext } from './Locator'

/**
 * Boundaries of items on the grid, in grid coordinates (not em).
 */
export type GridBoundaries = {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

/**
 * Dimensions of the visible grid window, in cells.
 */
export type GridSize = {
  columns: number
  rows: number
}

/**
 * This Locator places items on a rectangular grid with automatic panning.
 *
 * Items are positioned using their `location.x` and `location.y` as grid coordinates.
 * The gap between cells is defined by {@link gap} (in em).
 *
 * When a {@link gridSize} is provided, the locator maintains a stable visible window:
 * as long as all items fit inside, nothing moves. When items exceed the window,
 * the view recenters on the barycentre.
 *
 * Without {@link gridSize}, the grid always centers on the barycentre of the items.
 *
 * Multiple independent grids are supported via {@link getGridId}, following the same
 * pattern as {@link PileLocator.getPileId}.
 *
 * Override {@link getBoundaries} to provide custom boundaries (e.g. from a game helper).
 */
export class GridLocator<P extends number = number, M extends number = number, L extends number = number> extends Locator<P, M, L> {

  constructor(clone?: Partial<GridLocator>) {
    super()
    Object.assign(this, clone)
  }

  /**
   * The gap between two consecutive grid cells, in em.
   */
  gap?: Partial<Coordinates>

  /**
   * Function to override to provide a {@link gap} that depends on the context.
   * @param _location Location to position
   * @param _context Context of the game
   * @returns The gap between two consecutive grid cells
   */
  getGap(_location: Location<P, L>, _context: MaterialContext<P, M, L>): Partial<Coordinates> {
    return this.gap ?? {}
  }

  /**
   * The size of the visible grid window, in cells.
   * When items fit inside the window, the view does not move.
   * When items exceed it, the view recenters on the barycentre.
   * Without gridSize, the view always centers on the barycentre.
   */
  gridSize?: GridSize

  /**
   * Function to override to provide a {@link gridSize} that depends on the context.
   * @param _location Location to position
   * @param _context Context of the game
   * @returns The grid size
   */
  getGridSize(_location: Location<P, L>, _context: MaterialContext<P, M, L>): GridSize | undefined {
    return this.gridSize
  }

  /**
   * Identifier for the grid. By default, distinct location areas (different player, id or parent) form distinct grids.
   * @param location Location in the grid
   * @param _context Context of the game
   * @returns A unique identifier for the grid this location belongs to
   */
  getGridId(location: Location<P, L>, _context: MaterialContext<P, M, L>): string {
    return [location.player, location.id, location.parent].filter(part => part !== undefined).join('_')
  }

  /**
   * Compute the boundaries of all items on this grid, in grid coordinates.
   * Override this to provide custom boundaries (e.g. from a game helper).
   *
   * Default implementation scans all item types placed by this locator.
   *
   * @param location A location in the grid area
   * @param context Context of the game
   * @returns The grid boundaries, or undefined if no items exist
   */
  getBoundaries(location: Location<P, L>, context: MaterialContext<P, M, L>): GridBoundaries | undefined {
    const { rules } = context
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity
    let found = false
    for (const type of this.itemTypes) {
      const items = rules.material(type).location(loc => isSameLocationArea(loc, location)).getItems()
      for (const item of items) {
        const x = item.location.x ?? 0
        const y = item.location.y ?? 0
        if (x < xMin) xMin = x
        if (x > xMax) xMax = x
        if (y < yMin) yMin = y
        if (y > yMax) yMax = y
        found = true
      }
    }
    return found ? { xMin, xMax, yMin, yMax } : undefined
  }

  private deltas = new Map<string, { deltaX: number, deltaY: number }>()
  private game?: object
  private refreshedGrids = new Set<string>()

  private refreshDelta(location: Location<P, L>, context: MaterialContext<P, M, L>, gridId: string) {
    const boundaries = this.getBoundaries(location, context)
    if (!boundaries) {
      this.deltas.set(gridId, { deltaX: 0, deltaY: 0 })
      return
    }

    const centerX = (boundaries.xMin + boundaries.xMax) / 2
    const centerY = (boundaries.yMin + boundaries.yMax) / 2

    if (!this.deltas.has(gridId)) {
      this.deltas.set(gridId, { deltaX: centerX, deltaY: centerY })
      return
    }

    const delta = this.deltas.get(gridId)!
    const size = this.getGridSize(location, context)
    if (!size || (boundaries.xMin === boundaries.xMax && boundaries.yMin === boundaries.yMax)) {
      // No gridSize, or single point: always center on barycentre
      delta.deltaX = centerX
      delta.deltaY = centerY
      return
    }

    const halfW = (size.columns - 1) / 2
    const halfH = (size.rows - 1) / 2

    // Recenter only the axis that exceeds the window
    if (boundaries.xMin < delta.deltaX - halfW || boundaries.xMax > delta.deltaX + halfW) {
      delta.deltaX = centerX
    }
    if (boundaries.yMin < delta.deltaY - halfH || boundaries.yMax > delta.deltaY + halfH) {
      delta.deltaY = centerY
    }
  }

  private ensureRefreshed(location: Location<P, L>, context: MaterialContext<P, M, L>, gridId: string) {
    if (context.rules.game !== this.game) {
      this.game = context.rules.game
      this.refreshedGrids.clear()
    }

    if (!this.refreshedGrids.has(gridId) && this.itemTypes) {
      this.refreshedGrids.add(gridId)
      this.refreshDelta(location, context, gridId)
    }
  }

  getCoordinates(location: Location<P, L>, context: MaterialContext<P, M, L>): Partial<Coordinates> {
    const gridId = this.getGridId(location, context)
    this.ensureRefreshed(location, context, gridId)
    const { x: gx = 0, y: gy = 0, z: gz = 0 } = this.getGap(location, context)
    const delta = this.deltas.get(gridId) ?? { deltaX: 0, deltaY: 0 }
    return {
      x: ((location.x ?? 0) - delta.deltaX) * gx,
      y: ((location.y ?? 0) - delta.deltaY) * gy,
      z: (location.z ?? 0) * gz
    }
  }

  getPositionDependencies(location: Location<P, L>, context: MaterialContext<P, M, L>): unknown {
    const gridId = this.getGridId(location, context)
    const delta = this.deltas.get(gridId) ?? { deltaX: 0, deltaY: 0 }
    return [delta.deltaX, delta.deltaY]
  }
}
