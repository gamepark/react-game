import { Interpolation, keyframes, Theme } from '@emotion/react'
import { Animation, AnimationStep } from '@gamepark/react-client'
import { CreateItem, GridBoundaries, ItemMove, MaterialRules } from '@gamepark/rules-api'
import { fadeIn } from '../../../css'
import { defaultOrigin, getItemFromContext, getOriginDeltaPosition, ItemContext } from '../../../locators'
import { getFirstStockItem, getFirstStockItemTransforms } from './getFirstStockItemTransforms.util'
import { ItemAnimations, ItemContextWithTrajectory } from './ItemAnimations'
import { MaterialGameAnimationContext } from './MaterialGameAnimations'
import { toClosestRotations, toSingleRotation } from './rotations.utils'
import { Trajectory } from './Trajectory'
import { transformItem } from './transformItem.util'

// Use action.id as key instead of object reference, because Immer proxies in the reducer
// differ from the finalized objects used during React rendering.
const createdItemIndexes = new Map<string | undefined, Map<number, number>>()
const preQuantitySnapshots = new WeakMap<object, Map<number, (number | undefined)[]>>()

function getConsequenceIndex(action: { played: number, animation?: { step?: number } }): number {
  const step = action.animation?.step
  return (step === AnimationStep.BEFORE_MOVE || step === AnimationStep.AFTER_UNDO)
    ? action.played - 1
    : action.played - 2
}

function getInnerMap<K, T>(map: { get(key: K): Map<number, T> | undefined, set(key: K, value: Map<number, T>): void }, key: K): Map<number, T> {
  let inner = map.get(key)
  if (!inner) {
    inner = new Map()
    map.set(key, inner)
  }
  return inner
}

function getWeakInnerMap<T>(weakMap: WeakMap<object, Map<number, T>>, action: object): Map<number, T> {
  let map = weakMap.get(action)
  if (!map) {
    map = new Map()
    weakMap.set(action, map)
  }
  return map
}

export class CreateItemAnimations<P extends number = number, M extends number = number, L extends number = number>
  extends ItemAnimations<P, M, L> {

  constructor(
    protected duration = 1,
    protected trajectory?: Trajectory<P, M, L>
  ) {
    super()
  }

  override getPreDuration(move: CreateItem<P, M, L>, context: MaterialGameAnimationContext<P, M, L>): number {
    const rules = new context.Rules(context.game, { player: context.playerId }) as MaterialRules<P, M, L>
    const items = rules.game.items?.[move.itemType] ?? []
    const key = getConsequenceIndex(context.action)
    getWeakInnerMap(preQuantitySnapshots, context.action).set(key, items.map((item: any) => item.quantity))
    return 0
  }

  override getPostDuration(move: CreateItem<P, M, L>, context: MaterialGameAnimationContext<P, M, L>): number {
    const rules = new context.Rules(context.game, { player: context.playerId }) as MaterialRules<P, M, L>
    const items: any[] = rules.game.items?.[move.itemType] ?? []
    const key = getConsequenceIndex(context.action)
    const actionId = context.action.id
    const snapshots = preQuantitySnapshots.get(context.action)
    const snapshot = snapshots?.get(key)

    if (snapshot) {
      for (let i = 0; i < items.length; i++) {
        const oldQuantity = i < snapshot.length ? (snapshot[i] ?? 1) : 0
        const newQuantity = items[i]?.quantity ?? 1
        if (newQuantity > oldQuantity) {
          getInnerMap(createdItemIndexes, actionId).set(key, i)
          break
        }
      }
      snapshots?.delete(key)
    } else {
      // Fallback: use prediction (may be wrong in simultaneous phases)
      getInnerMap(createdItemIndexes, actionId).set(key, rules.mutator(move.itemType).getItemCreationIndex(move.item))
    }

    // Clean up to prevent memory leaks (Map doesn't auto-collect like WeakMap)
    setTimeout(() => {
      const map = createdItemIndexes.get(actionId)
      if (map) {
        map.delete(key)
        if (map.size === 0) createdItemIndexes.delete(actionId)
      }
    }, this.duration * 2000)

    return this.duration
  }

  getItemAnimation(context: ItemContext<P, M, L>, animation: Animation<CreateItem<P, M, L>>, boundaries: GridBoundaries): Interpolation<Theme> {
    if (!this.isItemToAnimate(context, animation)) return
    const stockItem = getFirstStockItem(context)
    const stockTransforms = getFirstStockItemTransforms(context)
    if (stockItem && stockTransforms.length) {
      const originTransforms = toSingleRotation(stockTransforms)
      const targetTransforms = toSingleRotation(transformItem(context))
      toClosestRotations(originTransforms, targetTransforms)
      const futureItem = getItemFromContext(context)
      const currentOrigin = context.locators[stockItem.location.type]?.getLocationOrigin(stockItem.location, context) ?? defaultOrigin
      const futureOrigin = context.locators[futureItem.location.type]?.getLocationOrigin(futureItem.location, context) ?? defaultOrigin
      if (currentOrigin.x !== futureOrigin.x) {
        originTransforms.unshift(`translateX(${-getOriginDeltaPosition(boundaries.xMin, boundaries.xMax, futureOrigin.x, currentOrigin.x)}em)`)
      }
      if (currentOrigin.y !== futureOrigin.y) {
        originTransforms.unshift(`translateY(${-getOriginDeltaPosition(boundaries.yMin, boundaries.yMax, futureOrigin.y, currentOrigin.y)}em)`)
      }

      // Check if trajectory is configured
      const contextWithTrajectory = context as ItemContextWithTrajectory<P, M, L>
      const trajectory = this.trajectory ?? contextWithTrajectory.trajectory

      if (trajectory) {
        const trajectoryContext: ItemContextWithTrajectory<P, M, L> = { ...context, trajectory }
        const animationKeyframes = this.getTrajectoryKeyframes(originTransforms, targetTransforms, animation, trajectoryContext)
        return this.getAnimationCssWithTrajectory(animationKeyframes, animation.duration, trajectory.easing, trajectory.elevation)
      } else {
        const animationKeyframes = this.getTransformKeyframes(originTransforms.join(' '), targetTransforms.join(' '), animation, context)
        const description = context.material[context.type]
        return description?.getAnimationCss(animationKeyframes, animation.duration)
      }
    } else {
      return fadeIn(animation.duration)
    }
  }

  isItemToAnimate(context: ItemContext<P, M, L>, animation: Animation<CreateItem<P, M, L>>): boolean {
    const { type, index, displayIndex } = context
    const key = getConsequenceIndex(animation.action)
    let createdIndex = createdItemIndexes.get(animation.action.id)?.get(key)
    // Fallback: action.id may have changed during notification reconciliation
    // (local id "local-xxx" replaced by server-assigned id), so search all entries
    if (createdIndex === undefined) {
      for (const [, innerMap] of createdItemIndexes) {
        const candidate = innerMap.get(key)
        if (candidate !== undefined) {
          createdIndex = candidate
          break
        }
      }
    }
    if (animation.move.itemType !== type || createdIndex !== index) return false
    const quantity = getItemFromContext(context).quantity ?? 1
    const createdQuantity = animation.move.item.quantity ?? 1
    return displayIndex >= quantity - createdQuantity
  }

  protected getKeyframesFromOrigin(origin: string, _animation: Animation<ItemMove<P, M, L>>, _context: ItemContext<P, M, L>) {
    return keyframes`
      from {
        transform: ${origin};
      }
    `
  }
}
