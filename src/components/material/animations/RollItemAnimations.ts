import { Interpolation, Theme } from '@emotion/react'
import { Animation } from '@gamepark/react-client'
import { CreateItem, MaterialRulesCreator, RollItem } from '@gamepark/rules-api'
import { ItemContext } from '../../../locators'
import { ItemAnimations } from './ItemAnimations'
import { MaterialGameAnimationContext } from './MaterialGameAnimations'
import { transformItem } from './transformItem.util'

export class RollItemAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends ItemAnimations<P, M, L> {

  constructor(private duration = 1) {
    super()
  }

  override getPreDuration(_move: CreateItem<P, M, L>, _context: MaterialGameAnimationContext<P, M, L>): number {
    return this.duration
  }

  getItemAnimation(context: ItemContext<P, M, L>, animation: Animation<RollItem<P, M, L>>): Interpolation<Theme> {
    if (animation.move.itemType === context.type && animation.move.itemIndex === context.index) {
      return this.getRolledItemAnimation(context, animation)
    }
  }

  getRolledItemAnimation(context: ItemContext<P, M, L>, animation: Animation<RollItem<P, M, L>>): Interpolation<Theme> {
    const { type, rules, material, player, index } = context
    const description = material[type]
    const Rules = rules.constructor as MaterialRulesCreator<P, M, L>
    const futureRules = new Rules(JSON.parse(JSON.stringify(rules.game)), { player })
    futureRules.mutator(type).applyMove(animation.move)
    const futureItem = futureRules.material(type).getItem(index)!
    const sourceTransforms = transformItem(context)
    const futureTransforms = description?.getItemTransform(futureItem, context) ?? []
    addMissingOperations(sourceTransforms, futureTransforms)
    const sourceTransform = [...sourceTransforms, 'rotate3d(-1, -1, 0, 0)'].join(' ')
    const futureTransform = [...futureTransforms, 'rotate3d(-1, -1, 0, 1800deg)'].join(' ')
    const animationKeyframes = this.getTransformKeyframes(sourceTransform, futureTransform, animation, context)
    return description?.getAnimationCss(animationKeyframes, animation.duration)
  }
}

/**
 * For dice to rotate multiple time, the transform before and after must have exactly the same number of operations in the same order
 */
function addMissingOperations(transforms1: string[], transforms2: string[]) {
  let i = 0
  while (i < transforms1.length || i < transforms2.length) {
    if (!transforms1[i]) {
      transforms1.push(getNeutralTransform(transforms2[i]))
    } else if (!transforms2[i]) {
      transforms2.push(getNeutralTransform(transforms1[i]))
    } else if (!isSimilarTransform(transforms1[i], transforms2[i])) {
      if (transforms1.length < transforms2.length) {
        transforms1.splice(i, 0, getNeutralTransform(transforms2[i]))
      } else {
        transforms2.splice(i, 0, getNeutralTransform(transforms1[i]))
      }
    }
    i++
  }
}

function getNeutralTransform(transform: string) {
  if (transform.startsWith('rotate')) {
    return 'rotate(0)'
  } else if (transform.startsWith('translate')) {
    return 'translate(0)'
  } else if (transform.startsWith('scale')) {
    return 'scale(0)'
  } else {
    console.warn(`Unexpected operation to get neutral transform from: ${transform}`)
    return ''
  }
}

function isSimilarTransform(transform1: string, transform2: string) {
  return ['rotate', 'translate', 'scale'].some(instruction => transform1.startsWith(instruction) && transform2.startsWith(instruction))
}
