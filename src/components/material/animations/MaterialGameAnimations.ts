import { Interpolation, Theme } from '@emotion/react'
import { Animation, AnimationContext, Animations, DisplayedAction } from '@gamepark/react-client'
import { MaterialGame, MaterialMove, MaterialRules, MoveKind } from '@gamepark/rules-api'
import uniq from 'lodash/uniq'
import { ItemContext, MaterialContext } from '../../../locators'
import { GameContext } from '../../GameProvider'
import { MaterialSoundConfig } from '../sound/MaterialSoundConfig'
import { ensureMaterialSoundConfig } from '../sound/sound.utils'
import { ItemAnimations } from './ItemAnimations'
import { MaterialAnimations } from './MaterialAnimations'

export type MaterialGameAnimationContext<P extends number = number, M extends number = number, L extends number = number> =
  AnimationContext<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P>
  & Omit<GameContext<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P, M, L>, 'game'>

export type MaterialAnimationContext<P extends number = number, M extends number = number, L extends number = number> =
  MaterialContext<P, M, L> & { action: DisplayedAction<MaterialMove<P, M, L>, P> }

export class MaterialGameAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends Animations<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P> {

  readonly animationConfigs: AnimationConfig<P, M, L>[] = []
  defaultAnimationConfig = new AnimationConfig<P, M, L>()

  when(): AnimationConfig<P, M, L> {
    const animationConfig = new AnimationConfig<P, M, L>()
    this.animationConfigs.push(animationConfig)
    return animationConfig
  }

  override getDuration(move: MaterialMove<P, M, L>, context: MaterialGameAnimationContext<P, M, L>): number {
    const materialContext: MaterialAnimationContext<P, M, L> = {
      rules: new context.Rules(context.game) as MaterialRules<P, M, L>,
      material: context.material!,
      locators: context.locators!,
      player: context.playerId,
      action: context.action
    }
    return this.getAnimationConfig(move, materialContext).getDuration(move, context)
  }

  getAnimationConfig(move: MaterialMove<P, M, L>, context: MaterialAnimationContext<P, M, L>): AnimationConfig<P, M, L> {
    for (const animationConfig of this.animationConfigs) {
      if (animationConfig.filters.every(filter => filter(move, context))) {
        return animationConfig
      }
    }
    return this.defaultAnimationConfig
  }

  getSounds(): string[] {
    return uniq(this.animationConfigs
      .filter(animationConfig => !!animationConfig.s)
      .map(animationConfig => ensureMaterialSoundConfig(animationConfig.s!)!.sound)
    )
  }
}

class AnimationConfig<P extends number = number, M extends number = number, L extends number = number>
  extends ItemAnimations<P, M, L> {
  filters: ((move: MaterialMove<P, M, L>, context: MaterialAnimationContext<P, M, L>) => boolean)[] = []
  d: number = 1
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
    if (move.kind !== MoveKind.ItemMove) return 0
    return new MaterialAnimations<P, M, L>(this.d).getDuration(move, context)
  }

  getItemAnimation(context: ItemContext<P, M, L>, animation: Animation<MaterialMove<P, M, L>>): Interpolation<Theme> {
    return new MaterialAnimations<P, M, L>(this.d).getItemAnimation(context, animation)
  }
}
