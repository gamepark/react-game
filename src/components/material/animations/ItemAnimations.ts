import { css, Interpolation, keyframes, Theme } from '@emotion/react'
import { Animation, Animations } from '@gamepark/react-client'
import { DisplayedItem, GridBoundaries, ItemMove, MaterialGame, MaterialMove, MaterialRules } from '@gamepark/rules-api'
import { ItemContext, MaterialContext } from '../../../locators'
import { MaterialGameAnimationContext } from './MaterialGameAnimations'
import { calculateElevation, defaultElevation, extractTranslation, interpolateCoordinate, Trajectory } from './Trajectory'

/**
 * Extended ItemContext that includes trajectory configuration.
 */
export type ItemContextWithTrajectory<P extends number = number, M extends number = number, L extends number = number> =
  ItemContext<P, M, L> & { trajectory?: Trajectory<P, M, L> }

export class ItemAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends Animations<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P> {

  getItemAnimation(_context: ItemContext<P, M, L>, _animation: Animation<MaterialMove<P, M, L>>, _boundaries: GridBoundaries): Interpolation<Theme> {
    return
  }

  getMaterialContext({ Rules, game, material, locators, playerId }: MaterialGameAnimationContext<P, M, L>): MaterialContext<P, M, L> {
    return { rules: new Rules(game, { player: playerId }) as MaterialRules<P, M, L>, material: material!, locators: locators!, player: playerId }
  }

  getItemContext(context: MaterialGameAnimationContext<P, M, L>, item: Omit<DisplayedItem<M>, 'displayIndex'>): Omit<ItemContext<P, M, L>, 'displayIndex'> {
    return { ...this.getMaterialContext(context), ...item }
  }

  /**
   * Generate simple from/to keyframes (legacy method).
   */
  protected getTransformKeyframes(origin: string, destination: string, _animation: Animation<ItemMove<P, M, L>>, _context: ItemContext<P, M, L>) {
    return keyframes`
      from {
        transform: ${origin};
      }
      to {
        transform: ${destination};
      }
    `
  }

  /**
   * Generate keyframes with integrated elevation and optional waypoints.
   * The elevation is prepended to the transform chain so it operates in world coordinates.
   *
   * @param originTransforms Array of CSS transforms for the starting position
   * @param targetTransforms Array of CSS transforms for the ending position
   * @param animation The animation context
   * @param context The item context (may include trajectory configuration)
   */
  protected getTrajectoryKeyframes(
    originTransforms: string[],
    targetTransforms: string[],
    animation: Animation<ItemMove<P, M, L>>,
    context: ItemContextWithTrajectory<P, M, L>
  ) {
    const trajectory = context.trajectory
    const elevationConfig = trajectory?.elevation !== false ? (trajectory?.elevation ?? defaultElevation) : false
    const waypoints = trajectory?.waypoints ?? []

    // If no elevation and no waypoints, use simple keyframes
    if (elevationConfig === false && waypoints.length === 0) {
      return this.getTransformKeyframes(originTransforms.join(' '), targetTransforms.join(' '), animation, context)
    }

    // Collect all time points
    const timePoints = new Set<number>([0, 1])

    // Add waypoint times
    waypoints.forEach(w => timePoints.add(w.at))

    // Add elevation peak if not already present
    if (elevationConfig && !timePoints.has(elevationConfig.peak ?? 0.5)) {
      timePoints.add(elevationConfig.peak ?? 0.5)
    }

    const sortedTimes = [...timePoints].sort((a, b) => a - b)

    // Extract coordinates for interpolation
    const originCoords = extractTranslation(originTransforms)
    const targetCoords = extractTranslation(targetTransforms)

    // Build keyframes
    const frames: string[] = []

    for (const t of sortedTimes) {
      const elevation = elevationConfig ? calculateElevation(t, elevationConfig) : 0

      // Find if there's a waypoint at this time
      const waypoint = waypoints.find(w => Math.abs(w.at - t) < 0.001)

      // Calculate base interpolated position
      let x = interpolateCoordinate(originCoords.x, targetCoords.x, t)
      let y = interpolateCoordinate(originCoords.y, targetCoords.y, t)
      let z = interpolateCoordinate(originCoords.z, targetCoords.z, t)

      // Apply waypoint modifications
      if (waypoint) {
        if (waypoint.offset) {
          x += waypoint.offset.x ?? 0
          y += waypoint.offset.y ?? 0
          z += waypoint.offset.z ?? 0
        }
        if (waypoint.coordinates) {
          x = waypoint.coordinates.x ?? x
          y = waypoint.coordinates.y ?? y
          z = waypoint.coordinates.z ?? z
        }
        // TODO: Handle waypoint.locator - requires access to locator system
      }

      // Build transform string with elevation FIRST (world coordinates)
      const transforms: string[] = []

      // Elevation in world coordinates (before any rotation)
      if (elevation !== 0) {
        transforms.push(`translateZ(${elevation}em)`)
      }

      // Interpolate between origin and target transforms
      // For now, we handle the common case of translate3d + rotateZ
      if (t === 0) {
        transforms.push(...originTransforms)
      } else if (t === 1) {
        transforms.push(...targetTransforms)
      } else {
        // Build interpolated transforms
        transforms.push('translate(-50%, -50%)')
        transforms.push(`translate3d(${x}em, ${y}em, ${z}em)`)

        // Interpolate rotation if present
        const originRotation = extractRotation(originTransforms)
        const targetRotation = extractRotation(targetTransforms)
        if (originRotation !== undefined || targetRotation !== undefined) {
          const rotation = interpolateCoordinate(originRotation ?? 0, targetRotation ?? 0, t)
          if (rotation !== 0) {
            transforms.push(`rotateZ(${rotation}deg)`)
          }
        }
      }

      const percent = Math.round(t * 100)
      const transformString = transforms.join(' ')

      // Add easing for this segment if specified in waypoint
      const easing = waypoint?.easing
      if (easing && t < 1) {
        frames.push(`${percent}% { transform: ${transformString}; animation-timing-function: ${easing}; }`)
      } else {
        frames.push(`${percent}% { transform: ${transformString}; }`)
      }
    }

    return keyframes`${frames.join('\n')}`
  }

  /**
   * Generate animation CSS with integrated elevation.
   * This replaces the two-div approach with a single animated element.
   *
   * @param animationKeyframes The generated keyframes
   * @param duration Animation duration in seconds
   * @param easing CSS easing function
   */
  protected getAnimationCssWithTrajectory(
    animationKeyframes: ReturnType<typeof keyframes>,
    duration: number,
    easing: string = 'ease-in-out'
  ): Interpolation<Theme> {
    return css`
      animation: ${animationKeyframes} ${duration}s ${easing} forwards;
    `
  }
}

/**
 * Extract rotation value from transform array.
 * @param transforms Array of CSS transform strings
 * @returns Rotation in degrees, or undefined if no rotation found
 */
function extractRotation(transforms: string[]): number | undefined {
  for (const transform of transforms) {
    const rotateZMatch = transform.match(/rotateZ\(\s*([-\d.]+)(deg|rad|turn)?\s*\)/)
    if (rotateZMatch) {
      const value = parseFloat(rotateZMatch[1])
      const unit = rotateZMatch[2] || 'deg'
      if (unit === 'rad') return value * (180 / Math.PI)
      if (unit === 'turn') return value * 360
      return value
    }
  }
  return undefined
}
