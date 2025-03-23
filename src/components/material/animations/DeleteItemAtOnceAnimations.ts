import { css, Interpolation, keyframes, Theme } from '@emotion/react'
import { Animation } from '@gamepark/react-client'
import { DeleteItemsAtOnce } from '@gamepark/rules-api'
import { ItemContext } from '../../../locators'
import { getFirstStockItemTransforms } from './getFirstStockItemTransforms.util'
import { ItemAnimations } from './ItemAnimations'
import { toClosestRotations, toSingleRotation } from './rotations.utils'
import { transformItem } from './transformItem.util'

export class DeleteItemAtOnceAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends ItemAnimations<P, M, L> {

  constructor(protected duration = 1) {
    super()
  }

  override getPreDuration(): number {
    return this.duration
  }

  getItemAnimation(context: ItemContext<P, M, L>, animation: Animation<DeleteItemsAtOnce<M>>): Interpolation<Theme> {
    if (context.type === animation.move.itemType && animation.move.indexes.includes(context.index)) {
      return this.getMovedItemAnimation(context, animation)
    }
  }

  getMovedItemAnimation(context: ItemContext<P, M, L>, animation: Animation<DeleteItemsAtOnce<M>>): Interpolation<Theme> {
    const stockTransforms = getFirstStockItemTransforms(context)
    if (stockTransforms.length) {
      const originTransforms = toSingleRotation(transformItem(context))
      const targetTransforms = toSingleRotation(stockTransforms)
      toClosestRotations(originTransforms, targetTransforms)
      const animationKeyframes = this.getTransformKeyframes(originTransforms.join(' '), targetTransforms.join(' '), animation, context)
      const description = context.material[context.type]
      return description?.getAnimationCss(animationKeyframes, animation.duration)
    } else {
      const fadeout = keyframes`
        to {
          opacity: 0;
        }
      `
      return css`animation: ${fadeout} ${animation.duration}s ease-in-out forwards`
    }
  }
}
