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
  height: number

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
   * Override the elevation at this specific waypoint.
   * If not specified, uses the global elevation curve.
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

  const { height, peak = 0.5, curve = 'parabolic' } = config ?? defaultElevation

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
 * Creates a 3-keyframe arc: from (0) → peak (height) → to (0).
 */
export function getElevationKeyframes(config: ElevationConfig): ReturnType<typeof keyframes> {
  const { height, peak = 0.5 } = config
  const peakPercent = Math.round(peak * 100)
  const frames = `from, to { transform: translateZ(0); } ${peakPercent}% { transform: translateZ(${height}em); }`
  return keyframes`${frames}`
}

/**
 * Interpolate between two coordinate values.
 */
export function interpolateCoordinate(from: number, to: number, t: number): number {
  return from + (to - from) * t
}
