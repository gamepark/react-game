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

// FIFO queue keyed by consequence index — avoids dependency on unstable action IDs
// (action.id can change from "local-xxx" to server-assigned id between getPreDuration and getPostDuration)
const preQuantityQueue = new Map<number, (number | undefined)[][]>()

type CreatedItemEntry = { actionId: string | undefined, index: number, itemType: number }
const createdItemEntries = new Map<number, CreatedItemEntry[]>()

function getConsequenceIndex(action: { played: number, animation?: { step?: number } }): number {
  const step = action.animation?.step
  return (step === AnimationStep.BEFORE_MOVE || step === AnimationStep.AFTER_UNDO)
    ? action.played - 1
    : action.played - 2
}

function getOrCreateArray<T>(map: Map<number, T[]>, key: number): T[] {
  let arr = map.get(key)
  if (!arr) {
    arr = []
    map.set(key, arr)
  }
  return arr
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
    getOrCreateArray(preQuantityQueue, key).push(items.map((item: any) => item.quantity))
    return 0
  }

  override getPostDuration(move: CreateItem<P, M, L>, context: MaterialGameAnimationContext<P, M, L>): number {
    const rules = new context.Rules(context.game, { player: context.playerId }) as MaterialRules<P, M, L>
    const items: any[] = rules.game.items?.[move.itemType] ?? []
    const key = getConsequenceIndex(context.action)
    const actionId = context.action.id

    // Start with the prediction — always available and correct except in simultaneous phases
    let createdIndex = rules.mutator(move.itemType).getItemCreationIndex(move.item)

    // Dequeue the snapshot (FIFO — immune to action ID changes)
    const queue = preQuantityQueue.get(key)
    const snapshot = queue?.shift()
    if (queue && queue.length === 0) preQuantityQueue.delete(key)

    if (snapshot) {
      for (let i = 0; i < items.length; i++) {
        const oldQuantity = i < snapshot.length ? (snapshot[i] ?? 1) : 0
        const newQuantity = items[i]?.quantity ?? 1
        if (newQuantity > oldQuantity) {
          createdIndex = i
          break
        }
      }
    }

    const entry: CreatedItemEntry = { actionId, index: createdIndex, itemType: move.itemType }
    getOrCreateArray(createdItemEntries, key).push(entry)

    // Clean up to prevent memory leaks
    setTimeout(() => {
      const entries = createdItemEntries.get(key)
      if (entries) {
        const idx = entries.indexOf(entry)
        if (idx !== -1) entries.splice(idx, 1)
        if (entries.length === 0) createdItemEntries.delete(key)
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
    const entries = createdItemEntries.get(key)

    // Primary: match by action ID
    let entry = entries?.find(e => e.actionId === animation.action.id)

    // Fallback: action.id may have changed (local → server), match by itemType
    if (!entry) {
      entry = entries?.findLast(e => e.itemType === animation.move.itemType)
      // Migrate the entry to the new action ID so subsequent calls find it directly
      if (entry) entry.actionId = animation.action.id
    }

    if (animation.move.itemType !== type || entry?.index !== index) return false
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
