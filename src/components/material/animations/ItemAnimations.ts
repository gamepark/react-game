import { css, Interpolation, keyframes, Theme } from '@emotion/react'
import { Animation, Animations } from '@gamepark/react-client'
import { DisplayedItem, GridBoundaries, ItemMove, Location, MaterialGame, MaterialItem, MaterialMove, MaterialRules } from '@gamepark/rules-api'
import { getItemFromContext, ItemContext, MaterialContext } from '../../../locators'
import { MaterialGameAnimationContext } from './MaterialGameAnimations'
import { defaultElevation, ElevationConfig, extractTranslation, getElevationKeyframes, interpolateCoordinate, Trajectory } from './Trajectory'

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
   * Generate keyframes with only a destination (no origin).
   * CSS will animate from the element's current visual state.
   * Used for dropped items where the drag transform is not available in the animation context.
   */
  protected getKeyframesToDestination(destination: string, _animation: Animation<ItemMove<P, M, L>>, _context: ItemContext<P, M, L>) {
    return keyframes`
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
    const waypoints = context.trajectory?.waypoints ?? []

    // If no waypoints, use simple keyframes
    if (waypoints.length === 0) {
      return this.getTransformKeyframes(originTransforms.join(' '), targetTransforms.join(' '), animation, context)
    }

    // Collect all time points
    const timePoints = new Set<number>([0, 1])

    // Add waypoint times
    waypoints.forEach(w => timePoints.add(w.at))

    const sortedTimes = [...timePoints].sort((a, b) => a - b)

    // Extract coordinates for interpolation
    const originCoords = extractTranslation(originTransforms)
    const targetCoords = extractTranslation(targetTransforms)

    // Build keyframes
    const frames: string[] = []

    for (const t of sortedTimes) {
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
      }

      // Build transform string
      const transforms: string[] = []

      // Handle locator waypoints: use full transforms from the locator
      if (waypoint?.locator !== undefined) {
        const locator = waypoint.locator
        const resolvedLocation = typeof waypoint.location === 'function'
          ? waypoint.location(getItemFromContext(context))
          : waypoint.location
        const location = { ...resolvedLocation } as Location<P, L>
        const fakeItem = { location } as MaterialItem<P, L>
        const locatorTransforms = locator.placeItem(fakeItem, context)
        transforms.push('translate(-50%, -50%)')
        transforms.push(...locatorTransforms)
      } else if (t === 0 && !waypoint) {
        transforms.push(...originTransforms)
      } else if (t === 1 && !waypoint) {
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
   * Generate animation CSS with elevation on the parent div and position on the child div.
   *
   * @param animationKeyframes The generated keyframes for position (child div)
   * @param duration Animation duration in seconds
   * @param easing CSS easing function
   * @param elevationConfig Elevation configuration for the parent div arc
   */
  protected getAnimationCssWithTrajectory(
    animationKeyframes: ReturnType<typeof keyframes>,
    duration: number,
    easing: string = 'ease-in-out',
    elevationConfig?: ElevationConfig | false
  ): Interpolation<Theme> {
    if (elevationConfig !== false) {
      const resolvedElevation = elevationConfig ?? defaultElevation
      const elevationArc = getElevationKeyframes(resolvedElevation)
      return css`
        animation: ${elevationArc} ${duration}s ease-in-out forwards;
        > * {
          animation: ${animationKeyframes} ${duration}s ${easing} forwards;
        }
      `
    }
    return css`
      > * {
        animation: ${animationKeyframes} ${duration}s ${easing} forwards;
      }
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
