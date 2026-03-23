import { Interpolation, keyframes, Theme } from '@emotion/react'
import { Animation } from '@gamepark/react-client'
import { CreateItem, GridBoundaries, ItemMove, MaterialRules, MaterialRulesCreator } from '@gamepark/rules-api'
import { fadeIn } from '../../../css'
import { defaultOrigin, getItemFromContext, getOriginDeltaPosition, ItemContext } from '../../../locators'
import { getFirstStockItem, getFirstStockItemTransforms } from './getFirstStockItemTransforms.util'
import { ItemAnimations, ItemContextWithTrajectory } from './ItemAnimations'
import { MaterialGameAnimationContext } from './MaterialGameAnimations'
import { toClosestRotations, toSingleRotation } from './rotations.utils'
import { Trajectory } from './Trajectory'
import { transformItem } from './transformItem.util'

// Pre-quantity snapshot captured synchronously between getPreDuration and getPostDuration
// within the same reducer call. No keying needed — only one CreateItem is processed at a time.
let pendingSnapshot: (number | undefined)[] | undefined

// Module-level cache for create sibling animation: avoids reconstructing the pre-create state
// for every sibling item. Keyed by animation object (same reference within a render cycle).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createSiblingRulesCache = new WeakMap<object, any>()

export class CreateItemAnimations<P extends number = number, M extends number = number, L extends number = number, R extends number = number, V extends number = number>
  extends ItemAnimations<P, M, L, R, V> {

  constructor(
    protected duration = 1,
    protected trajectory?: Trajectory<P, M, L>
  ) {
    super()
  }

  override getPreDuration(move: CreateItem<P, M, L>, context: MaterialGameAnimationContext<P, M, L, R, V>): number {
    const rules = new context.Rules(context.game, { player: context.playerId }) as MaterialRules<P, M, L, R, V>
    const items = rules.game.items?.[move.itemType] ?? []
    pendingSnapshot = items.map((item: any) => item.quantity)
    return 0
  }

  override getPostDuration(move: CreateItem<P, M, L>, context: MaterialGameAnimationContext<P, M, L, R, V>): number {
    const rules = new context.Rules(context.game, { player: context.playerId }) as MaterialRules<P, M, L, R, V>
    const items: any[] = rules.game.items?.[move.itemType] ?? []

    // Start with the prediction — always available and correct except in simultaneous phases
    let createdIndex = rules.mutator(move.itemType).getItemCreationIndex(move.item)

    // Improve with snapshot comparison: find the first item whose quantity increased
    const snapshot = pendingSnapshot
    pendingSnapshot = undefined
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

    // Compute the range of displayIndexes to animate
    const quantity = items[createdIndex]?.quantity ?? 1
    const createdQuantity = move.item.quantity ?? 1

    // Store animation data on the action (Immer draft) for use in isItemToAnimate
    context.action.animationData = { createdIndex, displayIndexes: [quantity - createdQuantity, quantity - 1] }

    return this.duration
  }

  getItemAnimation(context: ItemContext<P, M, L, R, V>, animation: Animation<CreateItem<P, M, L>>, boundaries: GridBoundaries): Interpolation<Theme> {
    if (!this.isItemToAnimate(context, animation)) {
      return this.getCreateSiblingAnimation(context, animation)
    }
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
      const contextWithTrajectory = context as ItemContextWithTrajectory<P, M, L, R, V>
      const trajectory = this.trajectory ?? contextWithTrajectory.trajectory

      if (trajectory) {
        const trajectoryContext: ItemContextWithTrajectory<P, M, L, R, V> = { ...context, trajectory }
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

  isItemToAnimate(context: ItemContext<P, M, L, R, V>, animation: Animation<CreateItem<P, M, L>>): boolean {
    const { type, index, displayIndex } = context
    const data = animation.action.animationData
    if (!data || animation.move.itemType !== type || data.createdIndex !== index) return false
    return displayIndex >= data.displayIndexes[0] && displayIndex <= data.displayIndexes[1]
  }

  /**
   * Compute animation for sibling items during a CreateItem animation.
   * Since CreateItem is a post-move animation, the state already includes the created item.
   * We reconstruct the pre-create state to compute the origin position.
   */
  private getCreateSiblingAnimation(
    context: ItemContext<P, M, L, R, V>,
    animation: Animation<CreateItem<P, M, L>>
  ): Interpolation<Theme> {
    const data = animation.action.animationData
    if (!data) return
    const item = getItemFromContext(context)
    const locator = context.locators[item.location.type]
    if (!locator) return
    let beforeRules = createSiblingRulesCache.get(animation) as MaterialRules<P, M, L, R, V> | undefined
    if (!beforeRules) {
      // Reconstruct pre-create state by removing the created item
      const beforeGame = JSON.parse(JSON.stringify(context.rules.game))
      const items = beforeGame.items[animation.move.itemType]
      if (!items) return
      const createdItem = items[data.createdIndex]
      if (!createdItem) return
      const createdQuantity = animation.move.item.quantity ?? 1
      const existingQuantity = createdItem.quantity ?? 1
      if (existingQuantity <= createdQuantity) {
        items.splice(data.createdIndex, 1)
      } else {
        createdItem.quantity = existingQuantity - createdQuantity
      }
      const Rules = context.rules.constructor as MaterialRulesCreator<P, M, L, R, V>
      beforeRules = new Rules(beforeGame, { player: context.player })
      createSiblingRulesCache.set(animation, beforeRules)
    }
    const beforeContext: ItemContext<P, M, L, R, V> = { ...context, rules: beforeRules }
    // Origin is pre-create state, target is current (post-create) state
    return this.computeSiblingAnimation(item, beforeContext, context, animation)
  }

  protected getKeyframesFromOrigin(origin: string, _animation: Animation<ItemMove<P, M, L>>, _context: ItemContext<P, M, L, R, V>) {
    return keyframes`
      from {
        transform: ${origin};
      }
    `
  }
}
