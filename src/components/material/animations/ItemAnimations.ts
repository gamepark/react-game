import { Interpolation, keyframes, Theme } from '@emotion/react'
import { Animation, Animations } from '@gamepark/react-client'
import { DisplayedItem, ItemMove, MaterialGame, MaterialMove, MaterialRules } from '@gamepark/rules-api'
import { ItemContext, MaterialContext } from '../../../locators'
import { MaterialGameAnimationContext } from './MaterialGameAnimations'

export class ItemAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends Animations<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P> {

  getItemAnimation(_context: ItemContext<P, M, L>, _animation: Animation<MaterialMove<P, M, L>>): Interpolation<Theme> {
    return
  }

  getMaterialContext({ Rules, game, material, locators, playerId }: MaterialGameAnimationContext<P, M, L>): MaterialContext<P, M, L> {
    return { rules: new Rules(game, { player: playerId }) as MaterialRules<P, M, L>, material: material!, locators: locators!, player: playerId }
  }

  getItemContext(context: MaterialGameAnimationContext<P, M, L>, item: DisplayedItem<M>): ItemContext<P, M, L> {
    return { ...this.getMaterialContext(context), ...item }
  }

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
}