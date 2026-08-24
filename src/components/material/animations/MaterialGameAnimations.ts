import { Interpolation, Theme } from '@emotion/react'
import { Animation, AnimationContext, Animations, AnimationStep, DisplayedAction } from '@gamepark/react-client'
import { GridBoundaries, isEndPlayerTurn, ItemMove, MaterialGame, MaterialMove, MaterialRules, MoveKind } from '@gamepark/rules-api'
import { uniq } from 'es-toolkit'
import { ItemContext, MaterialContext } from '../../../locators'
import { GameContext } from '../../GameProvider'
import { MaterialSoundConfig } from '../sound'
import { ensureMaterialSoundConfig } from '../sound/sound.utils'
import { AnimationBuilder, AnimationPredicate, isMaterial, isMoveType, isRule } from './AnimationBuilder'
import { ItemAnimations } from './ItemAnimations'
import { MaterialAnimations } from './MaterialAnimations'

export type MaterialGameAnimationContext<P extends number = number, M extends number = number, L extends number = number, R extends number = number, V extends number = number> =
  AnimationContext<MaterialGame<P, M, L, R, V>, MaterialMove<P, M, L, R, V>, P>
  & Omit<GameContext<MaterialGame<P, M, L, R, V>, MaterialMove<P, M, L, R, V>, P, M, L, R, V>, 'game'>

export type MaterialAnimationContext<P extends number = number, M extends number = number, L extends number = number, R extends number = number, V extends number = number> =
  MaterialContext<P, M, L, R, V> & { action: DisplayedAction<MaterialMove<P, M, L, R, V>, P> }

export class MaterialGameAnimations<P extends number = number, M extends number = number, L extends number = number, R extends number = number, V extends number = number>
  extends Animations<MaterialGame<P, M, L, R, V>, MaterialMove<P, M, L, R, V>, P> {

  /** @internal Animation configurations from the legacy .when() API */
  readonly animationConfigs: AnimationConfig<P, M, L, R, V>[] = []

  /** @internal Animation builders from the new .configure() API */
  readonly animationBuilders: AnimationBuilder<P, M, L, R, V>[] = []

  /** @internal Default animation configuration */
  defaultAnimationConfig = new AnimationConfig<P, M, L, R, V>()

  /** @internal Default animation builder for new API */
  private _defaultBuilder = new AnimationBuilder<P, M, L, R, V>()

  // ==========================================
  // Legacy API (backward compatible)
  // ==========================================

  /**
   * @deprecated Use configure() instead for the new trajectory API.
   * Create a new animation configuration with filter chain.
   */
  when(): AnimationConfig<P, M, L, R, V> {
    const animationConfig = new AnimationConfig<P, M, L, R, V>()
    this.animationConfigs.push(animationConfig)
    return animationConfig
  }

  // ==========================================
  // New API
  // ==========================================

  /**
   * Configure animations for moves matching a predicate.
   * @param predicate Function to determine if this configuration applies
   * @returns AnimationBuilder for fluent configuration
   *
   * @example
   * ```ts
   * animations.configure(and(isRule(RuleId.PlayCard), isMyMove()))
   *   .duration(800)
   *   .arc(15)
   * ```
   */
  configure(predicate: AnimationPredicate<P, M, L, R, V>): AnimationBuilder<P, M, L, R, V> {
    const builder = new AnimationBuilder<P, M, L, R, V>()
    builder.filter(predicate)
    this.animationBuilders.push(builder)
    return builder
  }

  /**
   * Configure animations for moves during a specific rule.
   * @param ruleId The rule ID to match
   * @returns AnimationBuilder for fluent configuration
   *
   * @example
   * ```ts
   * animations.forRule(RuleId.PlayCard)
   *   .duration(600)
   *   .via(LocationType.TableCenter)
   * ```
   */
  forRule(ruleId: number): AnimationBuilder<P, M, L, R, V> {
    return this.configure(isRule(ruleId))
  }

  /**
   * Configure animations for a specific item move type.
   * @param moveType The item move type to match (Create, Move, Delete, etc.)
   * @returns AnimationBuilder for fluent configuration
   *
   * @example
   * ```ts
   * animations.forMove(ItemMoveType.Move)
   *   .duration(500)
   *   .arc(12)
   * ```
   */
  forMove(moveType: ItemMove<P, M, L>['type']): AnimationBuilder<P, M, L, R, V> {
    return this.configure(isMoveType(moveType))
  }

  /**
   * Configure animations for a specific material type.
   * @param materialType The material type to match
   * @returns AnimationBuilder for fluent configuration
   *
   * @example
   * ```ts
   * animations.forMaterial(MaterialType.Card)
   *   .duration(400)
   *   .flat()  // No arc for cards
   * ```
   */
  forMaterial(materialType: M): AnimationBuilder<P, M, L, R, V> {
    return this.configure(isMaterial(materialType))
  }

  /**
   * Configure default animations (applies to all moves not matched by other configurations).
   * @returns AnimationBuilder for fluent configuration
   *
   * @example
   * ```ts
   * animations.defaults()
   *   .duration(600)
   *   .arc({ height: 8, peak: 0.4 })
   * ```
   */
  defaults(): AnimationBuilder<P, M, L, R, V> {
    return this._defaultBuilder
  }

  // ==========================================
  // Internal methods
  // ==========================================

  override getDuration(move: MaterialMove<P, M, L, R, V>, context: MaterialGameAnimationContext<P, M, L, R, V>): number {
    const materialContext: MaterialAnimationContext<P, M, L, R, V> = {
      rules: new context.Rules(context.game) as MaterialRules<P, M, L, R, V>,
      material: context.material!,
      locators: context.locators!,
      player: context.playerId,
      action: context.action
    }

    // Check new API builders first
    const builder = this.getAnimationBuilder(move, materialContext)
    if (builder) {
      return builder.getDuration(move, context)
    }

    // Fall back to legacy API
    return this.getAnimationConfig(move, materialContext).getDuration(move, context)
  }

  /**
   * Find matching animation builder from new API.
   * @internal
   */
  getAnimationBuilder(move: MaterialMove<P, M, L, R, V>, context: MaterialAnimationContext<P, M, L, R, V>): AnimationBuilder<P, M, L, R, V> | undefined {
    for (const builder of this.animationBuilders) {
      if (builder.matches(move, context)) {
        return builder
      }
    }
    // Check if default builder has any configuration
    if (this._defaultBuilder.durationSeconds !== undefined || typeof this._defaultBuilder.trajectoryConfig === 'function' || this._defaultBuilder.trajectoryConfig.elevation !== undefined) {
      return this._defaultBuilder
    }
    return undefined
  }

  /**
   * Find matching animation config from legacy API.
   * @internal
   */
  getAnimationConfig(move: MaterialMove<P, M, L, R, V>, context: MaterialAnimationContext<P, M, L, R, V>): AnimationConfig<P, M, L, R, V> {
    for (const animationConfig of this.animationConfigs) {
      if (animationConfig.filters.every(filter => filter(move, context))) {
        return animationConfig
      }
    }
    return this.defaultAnimationConfig
  }

  /**
   * Sound the animation API configures for a move: a sound, `false` when the game explicitly silences the
   * move, or undefined when the animations say nothing and the material description should decide.
   *
   * Not expressed through {@link getAnimationBuilder}, on purpose. That method only hands back the default
   * builder when it carries a duration or a trajectory, because those are what change the way a move is
   * animated. A default builder carrying nothing but a sound — `animations.defaults().sound(false)`, the way
   * a game turns the library's default sounds off wholesale — would never be returned, and the switch would
   * silently do nothing.
   *
   * @internal
   */
  getSoundConfig(move: MaterialMove<P, M, L, R, V>, context: MaterialAnimationContext<P, M, L, R, V>): string | MaterialSoundConfig | false | undefined {
    for (const builder of this.animationBuilders) {
      if (builder.matches(move, context) && builder.soundConfig !== undefined) return builder.soundConfig
    }
    if (this._defaultBuilder.soundConfig !== undefined) return this._defaultBuilder.soundConfig
    return this.getAnimationConfig(move, context).s
  }

  /**
   * Get item animation CSS, checking both new and legacy APIs.
   * @internal
   */
  getItemAnimation(context: ItemContext<P, M, L, R, V>, animation: Animation<MaterialMove<P, M, L, R, V>>, action: DisplayedAction<MaterialMove<P, M, L, R, V>, P>, boundaries: GridBoundaries): Interpolation<Theme> {
    const materialContext: MaterialAnimationContext<P, M, L, R, V> = {
      ...context,
      action
    }

    // Check new API builders first
    const builder = this.getAnimationBuilder(animation.move, materialContext)
    if (builder) {
      return builder.getItemAnimation(context, animation, boundaries)
    }

    // Fall back to legacy API
    return this.getAnimationConfig(animation.move, materialContext).getItemAnimation(context, animation, boundaries)
  }

  getSounds(): string[] {
    const legacySounds = this.animationConfigs
      .filter(animationConfig => !!animationConfig.s)
      .map(animationConfig => ensureMaterialSoundConfig(animationConfig.s!)!.sound)

    // `_defaultBuilder` is deliberately not part of `animationBuilders`, so `defaults().sound(url)` has to be
    // listed here too or that sound would be played without ever having been fetched and decoded.
    const newSounds = [...this.animationBuilders, this._defaultBuilder]
      .filter(builder => builder.soundConfig !== undefined && builder.soundConfig !== false)
      .map(builder => ensureMaterialSoundConfig(builder.soundConfig as string | MaterialSoundConfig)!.sound)

    return uniq([...legacySounds, ...newSounds])
  }

  pauseNextConsequenceAnimation(move: MaterialMove<P, M, L, R, V>, _context: AnimationContext<MaterialGame<P, M, L, R, V>, MaterialMove<P, M, L, R, V>, P>): boolean {
    return isEndPlayerTurn(move)
  }
}

/**
 * @deprecated Use AnimationBuilder with the new configure() API instead.
 * Legacy animation configuration class for backward compatibility.
 */
class AnimationConfig<P extends number = number, M extends number = number, L extends number = number, R extends number = number, V extends number = number>
  extends ItemAnimations<P, M, L, R, V> {
  filters: ((move: MaterialMove<P, M, L, R, V>, context: MaterialAnimationContext<P, M, L, R, V>) => boolean)[] = []
  d?: number
  s?: string | MaterialSoundConfig | false = undefined

  rule(ruleId: R): this {
    this.filters.push((_, context) => context.rules.game.rule?.id === ruleId)
    return this
  }

  move(predicate: (move: MaterialMove<P, M, L, R, V>, context: MaterialAnimationContext<P, M, L, R, V>) => boolean): this {
    this.filters.push((move, context) => predicate(move, context))
    return this
  }

  mine(): this {
    this.filters.push((_, context) => context.player === context.action.playerId)
    return this
  }

  duration(duration: number): this {
    this.d = duration
    return this
  }

  sound(sound: string | MaterialSoundConfig | false): this {
    this.s = sound
    return this
  }

  none() {
    return this.duration(0)
  }

  getDuration(move: MaterialMove<P, M, L, R, V>, context: MaterialGameAnimationContext<P, M, L, R, V>): number {
    if (move.kind !== MoveKind.ItemMove) return context.step === AnimationStep.BEFORE_MOVE ? this.d ?? 0 : 0
    return new MaterialAnimations<P, M, L, R, V>(this.d, undefined, undefined, this.d).getDuration(move, context)
  }

  getItemAnimation(context: ItemContext<P, M, L, R, V>, animation: Animation<MaterialMove<P, M, L, R, V>>, boundaries: GridBoundaries): Interpolation<Theme> {
    return new MaterialAnimations<P, M, L, R, V>(this.d, undefined, undefined, this.d).getItemAnimation(context, animation, boundaries)
  }
}
