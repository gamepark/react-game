import { Animation, Animations } from '@gamepark/react-client'
import { MaterialGame, MaterialMove } from '@gamepark/rules-api'
import { ItemContext } from '../../../locators'
import { Interpolation, Theme } from '@emotion/react'

export class ItemAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends Animations<MaterialGame<P, M, L>, MaterialMove<P, M, L>, P> {

  getItemAnimation(_context: ItemContext<P, M, L>, _animation: Animation<MaterialMove<P, M, L>>): Interpolation<Theme> {
    return
  }
}