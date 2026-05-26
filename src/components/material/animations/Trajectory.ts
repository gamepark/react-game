import { keyframes } from '@emotion/react'
import { Coordinates, Location, MaterialItem } from '@gamepark/rules-api'
import type { Locator } from '../../../locators'

/**
 * Configuration for the elevation arc during animation.
 * The elevation is applied in world coordinates (before rotation transforms).
 */
export interface ElevationConfig {
  /**
   * Maximum height of the arc in em units.
   * @default 10
   */
  height?: number

  /**
   * Position of the peak in the animation (0-1).
   * @default 0.5
   */
  peak?: number

  /**
   * Shape of the elevation curve.
   * - 'parabolic': smooth parabolic arc (default)
   * - 'linear': triangular arc with linear segments
   * - 'ease': uses CSS ease timing for smoother feel
   */
  curve?: 'parabolic' | 'linear' | 'ease'

  /**
   * Position at which the arc returns to 0 (0-1). After this point the
   * elevation stays at 0 for the rest of the animation — useful when the
   * card needs to slide flat for its final approach (e.g. landing under a
   * deck stack instead of dropping from above).
   * @default 1
   */
  landAt?: number
}

/**
 * A waypoint defines an intermediate position during an animation.
 * @typeParam P - Player ID type
 * @typeParam M - Material type (unused but kept for type consistency)
 * @typeParam L - Location type
 */
export interface Waypoint<P extends number = number, M extends number = number, L extends number = number> {
  /**
   * Position in the animation timeline (0-1).
   * 0 = start, 1 = end, 0.5 = middle
   */
  at: number

  /**
   * Use a locator instance to determine the position.
   * The locator will be used with the provided location to compute coordinates.
   */
  locator?: Locator<P, M, L>

  /**
   * Location parameters to pass to the locator.
   * Can be a static partial location, or a function receiving the animated item
   * to derive location dynamically (e.g., to preserve coordinates from origin).
   *
   * @example
   * // Static location
   * { locator: LocationType.Panel, location: { player: nextPlayer } }
   *
   * // Dynamic: preserve x from item's current location
   * { locator: LocationType.FaceDown, location: (item) => ({ x: item.location.x }) }
   */
  location?: Partial<Location<P, L>> | ((item: MaterialItem<P, L>) => Partial<Location<P, L>>)

  /**
   * Absolute coordinates for this waypoint.
   * Use this instead of locator for fixed positions.
   */
  coordinates?: Partial<Coordinates>

  /**
   * Offset relative to the linear interpolation between origin and destination.
   * Useful for creating arcs or detours without specifying absolute positions.
   */
  offset?: Partial<Coordinates>

  /**
   * Override the elevation at this specific waypoint (in em units).
   * If at least one waypoint defines elevation, waypoint-level elevation replaces the global elevation arc entirely.
   * Elevation is linearly interpolated between defined waypoints, with implicit 0 at t=0 and t=1.
   */
  elevation?: number

  /**
   * Z-axis rotation at this waypoint (in the locator's rotation unit).
   * If not specified, rotation is interpolated linearly.
   */
  rotation?: number

  /**
   * CSS easing function to use when animating TOWARDS this waypoint.
   * @example 'ease-in', 'ease-out', 'cubic-bezier(0.4, 0, 0.2, 1)'
   */
  easing?: string

  /** @internal Type brand to ensure M is used */
  _brand?: M
}

/**
 * Complete trajectory configuration for an animation.
 * @typeParam P - Player ID type
 * @typeParam M - Material type (unused but kept for type consistency)
 * @typeParam L - Location type
 */
export interface Trajectory<P extends number = number, M extends number = number, L extends number = number> {
  /**
   * Elevation configuration for the arc effect.
   * Set to false to disable elevation (flat movement).
   */
  elevation?: ElevationConfig | false

  /**
   * Intermediate waypoints for the trajectory.
   * Waypoints are sorted by their 'at' value automatically.
   */
  waypoints?: Waypoint<P, M, L>[]

  /**
   * Global CSS easing function for the animation.
   * @default 'ease-in-out'
   */
  easing?: string
}

/**
 * Default elevation configuration (arc of 10em at 50%).
 */
export const defaultElevation: ElevationConfig = {
  height: 10,
  peak: 0.5,
  curve: 'parabolic'
}

/**
 * Calculate the elevation value at a given point in time.
 * @param t Progress in the animation (0-1)
 * @param config Elevation configuration
 * @returns Elevation in em units
 */
export function calculateElevation(t: number, config: ElevationConfig | false | undefined): number {
  if (config === false) return 0

  const { height = 10, peak = 0.5, curve = 'parabolic' } = config ?? defaultElevation

  if (curve === 'linear') {
    // Triangular arc
    if (t <= peak) {
      return height * (t / peak)
    } else {
      return height * (1 - (t - peak) / (1 - peak))
    }
  }

  // Parabolic arc (default)
  // Parabola passing through (0, 0), (peak, height), (1, 0)
  if (t <= peak) {
    const normalized = t / peak
    return height * (1 - (1 - normalized) * (1 - normalized))
  } else {
    const normalized = (t - peak) / (1 - peak)
    return height * (1 - normalized * normalized)
  }
}

/**
 * Parse a transform string and extract x, y, z translations.
 * This is used to interpolate between waypoints.
 */
export function extractTranslation(transforms: string[]): Coordinates {
  let x = 0, y = 0, z = 0

  for (const transform of transforms) {
    const translate3dMatch = transform.match(/translate3d\(\s*([-\d.]+)em\s*,\s*([-\d.]+)em\s*,\s*([-\d.]+)em\s*\)/)
    if (translate3dMatch) {
      x += parseFloat(translate3dMatch[1])
      y += parseFloat(translate3dMatch[2])
      z += parseFloat(translate3dMatch[3])
      continue
    }

    const translateXMatch = transform.match(/translateX\(\s*([-\d.]+)em\s*\)/)
    if (translateXMatch) {
      x += parseFloat(translateXMatch[1])
      continue
    }

    const translateYMatch = transform.match(/translateY\(\s*([-\d.]+)em\s*\)/)
    if (translateYMatch) {
      y += parseFloat(translateYMatch[1])
      continue
    }

    const translateZMatch = transform.match(/translateZ\(\s*([-\d.]+)em\s*\)/)
    if (translateZMatch) {
      z += parseFloat(translateZMatch[1])
    }
  }

  return { x, y, z }
}

/**
 * Generate simple elevation keyframes for the parent div.
 *
 * Default behaviour (when `landAt` is omitted): a 3-keyframe arc — `from, to`
 * at translateZ(0) with a single `peak%` at `translateZ(height em)`. This is
 * the legacy shape; not touching it keeps every existing animation pixel-
 * perfect identical.
 *
 * When `landAt` is provided (must be in (0, 1)): a 4-keyframe arc — rises to
 * peak, descends back to 0 at `landAt`, then holds 0 until the end. Lets the
 * card slide flat for its final approach (e.g. landing under a deck stack).
 */
export function getElevationKeyframes(config: ElevationConfig): ReturnType<typeof keyframes> {
  const { height = 10, landAt } = config
  if (landAt === undefined) {
    const peak = config.peak ?? 0.5
    const peakPercent = Math.round(peak * 100)
    const frames = `from, to { transform: translateZ(0); } ${peakPercent}% { transform: translateZ(${height}em); }`
    return keyframes`${frames}`
  }
  // landAt mode: peak must sit strictly between 0 and landAt so the arc has
  // room to rise AND descend before the flat-landing plateau. When the caller
  // doesn't supply a peak we centre it inside [0, landAt]; if they pass a
  // peak >= landAt (legacy default 0.5 with landAt = 0.4 would land here),
  // we recentre too — otherwise the keyframe percentages collide and the
  // arc culminates AFTER landAt, defeating the flat plateau.
  const peak = config.peak !== undefined && config.peak < landAt ? config.peak : landAt / 2
  const peakPercent = Math.round(peak * 100)
  const landPercent = Math.round(landAt * 100)
  // Spell out the 100% keyframe explicitly. Combining `${landPercent}%, to`
  // in a single selector ought to apply translateZ(0) at both points, but
  // some CSS parsers in the @emotion stack treat the comma-joined selector
  // as overriding only the first point (landPercent) and leave 100% to be
  // interpolated back to the peak via the looping `infinite` we run the
  // arc on — visible as a tiny rebound at the very end of the trajectory.
  // Two separate keyframes at landPercent% and 100% pin both points and
  // avoid the rebound.
  const frames = `from { transform: translateZ(0); } ${peakPercent}% { transform: translateZ(${height}em); } ${landPercent}% { transform: translateZ(0); } to { transform: translateZ(0); }`
  return keyframes`${frames}`
}

/**
 * Generate elevation keyframes from waypoint-level elevation values.
 * Linearly interpolates between waypoints that define elevation, with implicit 0 at t=0 and t=1.
 */
export function getWaypointElevationKeyframes(
  waypoints: Pick<Waypoint, 'at' | 'elevation'>[]
): ReturnType<typeof keyframes> | undefined {
  const elevationWaypoints = waypoints.filter(w => w.elevation !== undefined)
  if (elevationWaypoints.length === 0) return undefined

  // Build elevation control points: implicit 0 at start/end + waypoint values
  const points: { at: number, elevation: number }[] = [
    { at: 0, elevation: 0 },
    ...elevationWaypoints.map(w => ({ at: w.at, elevation: w.elevation! })),
    { at: 1, elevation: 0 }
  ].sort((a, b) => a.at - b.at)

  const frames = points.map(p => {
    const percent = Math.round(p.at * 100)
    return `${percent}% { transform: translateZ(${p.elevation}em); }`
  })

  return keyframes`${frames.join('\n')}`
}

/**
 * Interpolate between two coordinate values.
 */
export function interpolateCoordinate(from: number, to: number, t: number): number {
  return from + (to - from) * t
}
