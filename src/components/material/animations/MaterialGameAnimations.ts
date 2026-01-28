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

export type MaterialGameAnimationContext<P extends number = number, M extends number = number, L extends number = number> =
  AnimationContext<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P>
  & Omit<GameContext<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P, M, L>, 'game'>

export type MaterialAnimationContext<P extends number = number, M extends number = number, L extends number = number> =
  MaterialContext<P, M, L> & { action: DisplayedAction<MaterialMove<P, M, L>, P> }

export class MaterialGameAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends Animations<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P> {

  /** @internal Animation configurations from the legacy .when() API */
  readonly animationConfigs: AnimationConfig<P, M, L>[] = []

  /** @internal Animation builders from the new .configure() API */
  readonly animationBuilders: AnimationBuilder<P, M, L>[] = []

  /** @internal Default animation configuration */
  defaultAnimationConfig = new AnimationConfig<P, M, L>()

  /** @internal Default animation builder for new API */
  private _defaultBuilder = new AnimationBuilder<P, M, L>()

  // ==========================================
  // Legacy API (backward compatible)
  // ==========================================

  /**
   * @deprecated Use configure() instead for the new trajectory API.
   * Create a new animation configuration with filter chain.
   */
  when(): AnimationConfig<P, M, L> {
    const animationConfig = new AnimationConfig<P, M, L>()
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
  configure(predicate: AnimationPredicate<P, M, L>): AnimationBuilder<P, M, L> {
    const builder = new AnimationBuilder<P, M, L>()
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
  forRule(ruleId: number): AnimationBuilder<P, M, L> {
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
  forMove(moveType: ItemMove<P, M, L>['type']): AnimationBuilder<P, M, L> {
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
  forMaterial(materialType: M): AnimationBuilder<P, M, L> {
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
  defaults(): AnimationBuilder<P, M, L> {
    return this._defaultBuilder
  }

  // ==========================================
  // Internal methods
  // ==========================================

  override getDuration(move: MaterialMove<P, M, L>, context: MaterialGameAnimationContext<P, M, L>): number {
    const materialContext: MaterialAnimationContext<P, M, L> = {
      rules: new context.Rules(context.game) as MaterialRules<P, M, L>,
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
  getAnimationBuilder(move: MaterialMove<P, M, L>, context: MaterialAnimationContext<P, M, L>): AnimationBuilder<P, M, L> | undefined {
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
  getAnimationConfig(move: MaterialMove<P, M, L>, context: MaterialAnimationContext<P, M, L>): AnimationConfig<P, M, L> {
    for (const animationConfig of this.animationConfigs) {
      if (animationConfig.filters.every(filter => filter(move, context))) {
        return animationConfig
      }
    }
    return this.defaultAnimationConfig
  }

  /**
   * Get item animation CSS, checking both new and legacy APIs.
   * @internal
   */
  getItemAnimation(context: ItemContext<P, M, L>, animation: Animation<MaterialMove<P, M, L>>, action: DisplayedAction<MaterialMove<P, M, L>, P>, boundaries: GridBoundaries): Interpolation<Theme> {
    const materialContext: MaterialAnimationContext<P, M, L> = {
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

    const newSounds = this.animationBuilders
      .filter(builder => builder.soundConfig !== undefined && builder.soundConfig !== false)
      .map(builder => ensureMaterialSoundConfig(builder.soundConfig as string | MaterialSoundConfig)!.sound)

    return uniq([...legacySounds, ...newSounds])
  }

  pauseNextConsequenceAnimation(move: MaterialMove<P, M, L>, _context: AnimationContext<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P>): boolean {
    return isEndPlayerTurn(move)
  }
}

/**
 * @deprecated Use AnimationBuilder with the new configure() API instead.
 * Legacy animation configuration class for backward compatibility.
 */
class AnimationConfig<P extends number = number, M extends number = number, L extends number = number>
  extends ItemAnimations<P, M, L> {
  filters: ((move: MaterialMove<P, M, L>, context: MaterialAnimationContext<P, M, L>) => boolean)[] = []
  d?: number
  s?: string | MaterialSoundConfig | false = undefined

  rule<RuleId extends number>(ruleId: RuleId): this {
    this.filters.push((_, context) => context.rules.game.rule?.id === ruleId)
    return this
  }

  move(predicate: (move: MaterialMove<P, M, L>, context: MaterialAnimationContext<P, M, L>) => boolean): this {
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

  getDuration(move: MaterialMove<P, M, L>, context: MaterialGameAnimationContext<P, M, L>): number {
    if (move.kind !== MoveKind.ItemMove) return context.step === AnimationStep.BEFORE_MOVE ? this.d ?? 0 : 0
    return new MaterialAnimations<P, M, L>(this.d).getDuration(move, context)
  }

  getItemAnimation(context: ItemContext<P, M, L>, animation: Animation<MaterialMove<P, M, L>>, boundaries: GridBoundaries): Interpolation<Theme> {
    return new MaterialAnimations<P, M, L>(this.d).getItemAnimation(context, animation, boundaries)
  }
}
