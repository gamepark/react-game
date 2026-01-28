import { Interpolation, Theme } from '@emotion/react'
import { Animation, AnimationStep } from '@gamepark/react-client'
import { Coordinates, GridBoundaries, ItemMove, MaterialMove, MoveKind } from '@gamepark/rules-api'
import { ItemContext, Locator } from '../../../locators'
import { MaterialSoundConfig } from '../sound'
import { ItemAnimations } from './ItemAnimations'
import { MaterialAnimationContext, MaterialGameAnimationContext } from './MaterialGameAnimations'
import { MaterialAnimations } from './MaterialAnimations'
import { defaultElevation, ElevationConfig, Trajectory, Waypoint } from './Trajectory'

/**
 * Predicate function to determine if an animation configuration applies to a move.
 */
export type AnimationPredicate<P extends number = number, M extends number = number, L extends number = number> =
  (move: MaterialMove<P, M, L>, context: MaterialAnimationContext<P, M, L>) => boolean

/**
 * Fluent builder for configuring animations.
 * Use this to define duration, sound, and trajectory for animations.
 */
export class AnimationBuilder<P extends number = number, M extends number = number, L extends number = number>
  extends ItemAnimations<P, M, L> {

  /** @internal Predicates to match moves */
  readonly predicates: AnimationPredicate<P, M, L>[] = []

  /** @internal Duration in seconds */
  private _duration?: number

  /** @internal Sound configuration */
  private _sound?: string | MaterialSoundConfig | false

  /** @internal Trajectory configuration */
  private _trajectory: Trajectory<P, M, L> | ((context: ItemContext<P, M, L>) => Trajectory<P, M, L>) = {}

  /** @internal Whether this animation plays after the move is applied */
  private _postMove = false

  /** @internal Custom item animation function */
  private _itemAnimation?: (context: ItemContext<P, M, L>, animation: Animation<MaterialMove<P, M, L>>, boundaries: GridBoundaries) => Interpolation<Theme>

  /**
   * Add a predicate to filter which moves this configuration applies to.
   * All predicates must return true for the configuration to apply.
   */
  filter(predicate: AnimationPredicate<P, M, L>): this {
    this.predicates.push(predicate)
    return this
  }

  /**
   * Set the animation duration in milliseconds.
   * @param ms Duration in milliseconds
   */
  duration(ms: number): this {
    this._duration = ms / 1000
    return this
  }

  /**
   * Get the configured duration in seconds.
   */
  get durationSeconds(): number | undefined {
    return this._duration
  }

  /**
   * Set the sound to play during the animation.
   * @param sound Sound file path, configuration object, or false to disable
   */
  sound(sound: string | MaterialSoundConfig | false): this {
    this._sound = sound
    return this
  }

  /**
   * Get the sound configuration.
   */
  get soundConfig(): string | MaterialSoundConfig | false | undefined {
    return this._sound
  }

  /**
   * Set a custom item animation function.
   * This overrides the default position-based animation with fully custom keyframes.
   * @param fn Function that returns CSS animation for each item
   */
  itemAnimation(fn: (context: ItemContext<P, M, L>, animation: Animation<MaterialMove<P, M, L>>, boundaries: GridBoundaries) => Interpolation<Theme>): this {
    this._itemAnimation = fn
    return this
  }

  /**
   * Skip this animation entirely (duration = 0).
   */
  skip(): this {
    this._duration = 0
    return this
  }

  /**
   * Make this animation play after the move is applied (AFTER_MOVE step).
   * By default, animations play before the move (BEFORE_MOVE step).
   * Useful for animating items that become visible only after the move.
   */
  postMove(): this {
    this._postMove = true
    return this
  }

  /**
   * Configure a complete trajectory with elevation and waypoints.
   * @param config Trajectory configuration
   */
  trajectory(config: Trajectory<P, M, L> | ((context: ItemContext<P, M, L>) => Trajectory<P, M, L>)): this {
    this._trajectory = config
    return this
  }

  /**
   * Get the trajectory configuration.
   */
  get trajectoryConfig(): Trajectory<P, M, L> | ((context: ItemContext<P, M, L>) => Trajectory<P, M, L>) {
    return this._trajectory
  }

  /**
   * Configure the elevation arc.
   * @param heightOrConfig Height in em, or full configuration object
   */
  arc(heightOrConfig?: number | ElevationConfig): this {
    if (typeof this._trajectory === 'function') this._trajectory = {}
    if (typeof heightOrConfig === 'number') {
      this._trajectory.elevation = { ...defaultElevation, height: heightOrConfig }
    } else if (heightOrConfig) {
      this._trajectory.elevation = heightOrConfig
    } else {
      this._trajectory.elevation = defaultElevation
    }
    return this
  }

  /**
   * Disable elevation (flat movement).
   */
  flat(): this {
    if (typeof this._trajectory === 'function') this._trajectory = {}
    this._trajectory.elevation = false
    return this
  }

  /**
   * Add a waypoint to pass through during the animation.
   * @param locatorOrCoordinates Locator instance or absolute coordinates
   * @param at Position in animation (0-1), default 0.5
   */
  via(locatorOrCoordinates: Locator<P, M, L> | Coordinates, at?: number): this
  via(waypoint: Waypoint<P, M, L>): this
  via(arg1: Locator<P, M, L> | Coordinates | Waypoint<P, M, L>, at: number = 0.5): this {
    if (typeof this._trajectory === 'function') this._trajectory = {}
    if (!this._trajectory.waypoints) {
      this._trajectory.waypoints = []
    }

    if (typeof arg1 === 'object' && 'at' in arg1) {
      // Full waypoint object
      this._trajectory.waypoints.push(arg1)
    } else if (typeof arg1 === 'object' && 'placeItem' in arg1) {
      // Locator instance
      this._trajectory.waypoints.push({ at, locator: arg1 as Locator<P, M, L> })
    } else if (typeof arg1 === 'object') {
      // Coordinates
      this._trajectory.waypoints.push({ at, coordinates: arg1 as Coordinates })
    }

    return this
  }

  /**
   * Add multiple waypoints to pass through.
   * @param waypoints Array of waypoints
   */
  through(...waypoints: Waypoint<P, M, L>[]): this {
    if (typeof this._trajectory === 'function') this._trajectory = {}
    if (!this._trajectory.waypoints) {
      this._trajectory.waypoints = []
    }
    this._trajectory.waypoints.push(...waypoints)
    return this
  }

  /**
   * Set the global easing function for the animation.
   * @param easing CSS easing function
   */
  easing(easing: string): this {
    if (typeof this._trajectory === 'function') this._trajectory = {}
    this._trajectory.easing = easing
    return this
  }

  /**
   * Check if this configuration matches a move.
   * @internal
   */
  matches(move: MaterialMove<P, M, L>, context: MaterialAnimationContext<P, M, L>): boolean {
    return this.predicates.every(predicate => predicate(move, context))
  }

  /**
   * Get the duration for this animation.
   * @internal
   */
  getDuration(move: MaterialMove<P, M, L>, context: MaterialGameAnimationContext<P, M, L>): number {
    if (this._postMove) {
      // Post-move animation: only return duration during AFTER_MOVE step
      if (context.step !== AnimationStep.AFTER_MOVE) return 0
      return this._duration ?? 1
    }
    if (move.kind !== MoveKind.ItemMove) return this._duration ?? 0
    const trajectory = typeof this._trajectory === 'function' ? {} : this._trajectory
    return new MaterialAnimationsWithTrajectory<P, M, L>(this._duration, trajectory).getDuration(move, context)
  }

  /**
   * Get the item animation CSS.
   * @internal
   */
  getItemAnimation(context: ItemContext<P, M, L>, animation: Animation<MaterialMove<P, M, L>>, boundaries: GridBoundaries): Interpolation<Theme> {
    if (this._itemAnimation) {
      return this._itemAnimation(context, animation, boundaries)
    }
    const trajectory = typeof this._trajectory === 'function' ? this._trajectory(context) : this._trajectory
    return new MaterialAnimationsWithTrajectory<P, M, L>(this._duration, trajectory).getItemAnimation(context, animation, boundaries)
  }
}

/**
 * Extended MaterialAnimations that supports trajectory configuration.
 * @internal
 */
class MaterialAnimationsWithTrajectory<P extends number = number, M extends number = number, L extends number = number>
  extends MaterialAnimations<P, M, L> {

  constructor(
    duration: number | undefined,
    trajectory: Trajectory<P, M, L>
  ) {
    // Pass trajectory directly to the parent constructor
    super(duration, 0.2, trajectory)
  }
}

// ==========================================
// Predicate helpers
// ==========================================

/**
 * Create a predicate that matches moves by the current player.
 */
export function isMyMove<P extends number = number, M extends number = number, L extends number = number>(): AnimationPredicate<P, M, L> {
  return (_, context) => context.player === context.action.playerId
}

/**
 * Create a predicate that matches moves during a specific rule.
 * @param ruleId The rule ID to match
 */
export function isRule<P extends number = number, M extends number = number, L extends number = number>(ruleId: number): AnimationPredicate<P, M, L> {
  return (_, context) => context.rules.game.rule?.id === ruleId
}

/**
 * Create a predicate that matches moves for a specific material type.
 * @param materialType The material type to match
 */
export function isMaterial<P extends number = number, M extends number = number, L extends number = number>(materialType: M): AnimationPredicate<P, M, L> {
  return (move) => move.kind === MoveKind.ItemMove && move.itemType === materialType
}

/**
 * Create a predicate that matches a specific item move type.
 * @param moveType The item move type to match
 */
export function isMoveType<P extends number = number, M extends number = number, L extends number = number>(
  moveType: ItemMove<P, M, L>['type']
): AnimationPredicate<P, M, L> {
  return (move) => move.kind === MoveKind.ItemMove && move.type === moveType
}

/**
 * Create a predicate that matches moves from a specific location type.
 * @param locationType The source location type to match
 */
export function isFromLocation<P extends number = number, M extends number = number, L extends number = number>(locationType: L): AnimationPredicate<P, M, L> {
  return (move, context) => {
    if (move.kind !== MoveKind.ItemMove) return false
    const item = context.rules.material(move.itemType).getItem('itemIndex' in move ? move.itemIndex : 0)
    return item?.location?.type === locationType
  }
}

/**
 * Create a predicate that matches moves to a specific location type.
 * @param locationType The destination location type to match
 */
export function isToLocation<P extends number = number, M extends number = number, L extends number = number>(locationType: L): AnimationPredicate<P, M, L> {
  return (move) => {
    if (move.kind !== MoveKind.ItemMove) return false
    return 'location' in move && move.location?.type === locationType
  }
}

// ==========================================
// Predicate combinators
// ==========================================

/**
 * Combine predicates with AND logic (all must match).
 */
export function and<P extends number = number, M extends number = number, L extends number = number>(
  ...predicates: AnimationPredicate<P, M, L>[]
): AnimationPredicate<P, M, L> {
  return (move, context) => predicates.every(p => p(move, context))
}

/**
 * Combine predicates with OR logic (any must match).
 */
export function or<P extends number = number, M extends number = number, L extends number = number>(
  ...predicates: AnimationPredicate<P, M, L>[]
): AnimationPredicate<P, M, L> {
  return (move, context) => predicates.some(p => p(move, context))
}

/**
 * Negate a predicate.
 */
export function not<P extends number = number, M extends number = number, L extends number = number>(
  predicate: AnimationPredicate<P, M, L>
): AnimationPredicate<P, M, L> {
  return (move, context) => !predicate(move, context)
}
