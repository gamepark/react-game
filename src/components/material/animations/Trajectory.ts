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
   * From there, the item is also at the depth of its destination: it slides in between the items it lands among,
   * under the ones above its place and over the ones below (see getLandingElevationKeyframes).
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

  /**
   * Fade the item in at the start of the animation and/or out at its end, e.g. for an item that comes from or goes to
   * a place where it is not displayed, instead of popping in or out. The fade runs apart from the trajectory: it changes
   * neither the path of the item nor its easing.
   */
  fade?: Fade
}

/**
 * Fade of an item during its animation, each part as a fraction of the animation (0-1).
 */
export interface Fade {
  /** Part of the animation during which the item fades in, from transparent */
  in?: number
  /** Part of the animation during which the item fades out, to transparent */
  out?: number
}

const percent = (part: number) => Math.round(part * 1000) / 10

/**
 * Generate the opacity keyframes of a fade, or undefined when there is nothing to fade.
 */
export function getFadeKeyframes(fade: Fade | undefined): ReturnType<typeof keyframes> | undefined {
  const fadeIn = Math.min(Math.max(fade?.in ?? 0, 0), 1)
  const fadeOut = Math.min(Math.max(fade?.out ?? 0, 0), 1 - fadeIn)
  if (!fadeIn && !fadeOut) return undefined
  const frames = [
    `0% { opacity: ${fadeIn ? 0 : 1}; }`,
    ...(fadeIn ? [`${percent(fadeIn)}% { opacity: 1; }`] : []),
    // Fully seen in between, unless the fade out starts right where the fade in ends
    ...(fadeOut && fadeIn + fadeOut < 1 ? [`${percent(1 - fadeOut)}% { opacity: 1; }`] : []),
    `100% { opacity: ${fadeOut ? 0 : 1}; }`
  ]
  return keyframes`${frames.join(' ')}`
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

/** The points of the curve a landing arc is drawn with, see {@link getLandingElevationKeyframes} */
const LANDING_STEPS = 20

/**
 * The arc of an item that lands at `landAt` (see {@link getElevationKeyframes}), at the depth of its destination from
 * there.
 *
 * The item itself moves from the depth it leaves to the depth it reaches along the easing of its trajectory: after it
 * has landed, it would still be on its way down or up, and cross on its last stretch the items it lands among (e.g. a
 * card that slides in between 2 cards of a hand, under the one at its right and over the one at its left). The arc
 * makes up the difference: smoothly until the landing, exactly from there, so that the item slides in at the depth of
 * its place.
 *
 * @param config Elevation configuration, with a `landAt`
 * @param easing The easing of the item's own keyframes (a keyword or a cubic-bezier)
 * @param depth The depth of the destination minus the depth of the origin, in em
 * @returns The landing arc, or the plain arc when the easing cannot be followed or there is no depth to make up
 */
export function getLandingElevationKeyframes(config: ElevationConfig, easing: string, depth: number): ReturnType<typeof keyframes> {
  const progress = getEasingProgress(easing)
  const { height = 10, landAt } = config
  if (!progress || !depth || landAt === undefined) return getElevationKeyframes(config)
  const peak = config.peak !== undefined && config.peak < landAt ? config.peak : landAt / 2
  const arc = (t: number) => (t <= peak ? (height * t) / peak : t <= landAt ? (height * (landAt - t)) / (landAt - peak) : 0)
  const smooth = (u: number) => {
    const v = Math.min(1, Math.max(0, u))
    return v * v * (3 - 2 * v)
  }
  const frames = new Map<string, string>()
  for (const t of [peak, landAt, ...Array.from({ length: LANDING_STEPS + 1 }, (_, step) => step / LANDING_STEPS)].sort((a, b) => a - b)) {
    const percent = String(Math.round(t * 1000) / 10)
    const elevation = arc(t) + depth * (1 - progress(t)) * smooth(t / landAt)
    frames.set(percent, `${percent}% { transform: translateZ(${Math.round(elevation * 10000) / 10000}em); }`)
  }
  return keyframes`${[...frames.values()].join(' ')}`
}

const easingKeywords: Record<string, [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1]
}

/**
 * How far along its way an item is at a point of its animation, for a CSS easing.
 * @param easing A keyword (linear, ease, ease-in, ease-out, ease-in-out) or a cubic-bezier()
 * @returns The progress (0-1) at a time (0-1), or undefined for another easing (steps(), linear() with stops…)
 */
export function getEasingProgress(easing: string): ((time: number) => number) | undefined {
  const bezier = easing.trim().match(/^cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)$/)
  const points = easingKeywords[easing.trim()] ?? (bezier ? (bezier.slice(1).map(Number) as [number, number, number, number]) : undefined)
  if (!points) return undefined
  const [x1, y1, x2, y2] = points
  const curve = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3
  return (time: number) => {
    if (time <= 0) return 0
    if (time >= 1) return 1
    // The curve parameter where the time is reached: x grows with it on a valid easing
    let low = 0
    let high = 1
    for (let i = 0; i < 40; i++) {
      const middle = (low + high) / 2
      if (curve(x1, x2, middle) < time) low = middle
      else high = middle
    }
    return curve(y1, y2, (low + high) / 2)
  }
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
