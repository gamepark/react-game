// @ts-nocheck
/**
 * @vitest-environment jsdom
 *
 * Nothing here touches the DOM: the class reaches the css index and the react-client store as it
 * loads, and both expect a document and a window to exist.
 */
import { describe, expect, it } from 'vitest'
import { CreateItemsAtOnceAnimations } from './CreateItemsAtOnceAnimations'

/**
 * One move, played the way the reducer plays it: it asks for the duration before, applies the move,
 * then asks again after. What is under test is what happens in between — which items the class calls
 * new — so the two states of the material are handed over rather than computed.
 */
const play = (animations, itemsBefore, itemsAfter) => {
  const move = { itemType: 1, items: [] }
  const action = {}
  const context = (items) => ({ Rules: class { constructor(game) { this.game = game } }, game: { items: { 1: items } }, action })
  animations.getPreDuration(move, context(itemsBefore))
  const duration = animations.getPostDuration(move, context(itemsAfter))
  return { duration, animationData: action.animationData }
}

/** What the display asks of every item on the table, one by one, while the animation runs. */
const isAnimated = (animations, animationData, index, displayIndex) =>
  animations.isItemToAnimate({ type: 1, index, displayIndex }, { move: { itemType: 1 }, action: { animationData } })

describe('CreateItemsAtOnceAnimations', () => {
  it('animates nothing at all by default: the bulk creations the move exists for stay free', () => {
    const animations = new CreateItemsAtOnceAnimations()
    const { duration, animationData } = play(animations, [], [{ location: {} }, { location: {} }])
    expect(duration).toBe(0)
    expect(animationData).toBeUndefined()
  })

  it('animates the items that took an index of their own', () => {
    const animations = new CreateItemsAtOnceAnimations(1)
    const before = [{ location: { x: 0 } }]
    const after = [...before, { location: { x: 1 } }, { location: { x: 2 } }]
    const { duration, animationData } = play(animations, before, after)
    expect(duration).toBe(1)
    expect(animationData.createdItems).toEqual([
      { index: 1, displayIndexes: [0, 0] },
      { index: 2, displayIndexes: [0, 0] }
    ])
    expect(isAnimated(animations, animationData, 0, 0)).toBe(false)
    expect(isAnimated(animations, animationData, 1, 0)).toBe(true)
    expect(isAnimated(animations, animationData, 2, 0)).toBe(true)
  })

  it('animates the copies added to an item that was already there, and only those', () => {
    const animations = new CreateItemsAtOnceAnimations(1)
    const { duration, animationData } = play(animations, [{ quantity: 2 }], [{ quantity: 5 }])
    expect(duration).toBe(1)
    expect(animationData.createdItems).toEqual([{ index: 0, displayIndexes: [2, 4] }])
    expect(isAnimated(animations, animationData, 0, 1)).toBe(false)
    expect(isAnimated(animations, animationData, 0, 2)).toBe(true)
    expect(isAnimated(animations, animationData, 0, 4)).toBe(true)
    expect(isAnimated(animations, animationData, 0, 5)).toBe(false)
  })

  it('animates an item that came back to a slot a deleted one had left empty', () => {
    const animations = new CreateItemsAtOnceAnimations(1)
    const { animationData } = play(animations, [{ quantity: 0 }, { quantity: 1 }], [{ quantity: 1 }, { quantity: 1 }])
    expect(animationData.createdItems).toEqual([{ index: 0, displayIndexes: [0, 0] }])
  })

  it('animates an item of another material for nothing', () => {
    const animations = new CreateItemsAtOnceAnimations(1)
    const { animationData } = play(animations, [], [{ location: {} }])
    expect(animations.isItemToAnimate({ type: 2, index: 0, displayIndex: 0 }, { move: { itemType: 1 }, action: { animationData } })).toBe(false)
  })

  it('holds still rather than guessing when the move was never seen coming', () => {
    const animations = new CreateItemsAtOnceAnimations(1)
    const action = {}
    const context = { Rules: class { constructor(game) { this.game = game } }, game: { items: { 1: [{ location: {} }] } }, action }
    // AFTER_MOVE alone, with no snapshot to compare with: every item would read as new.
    expect(animations.getPostDuration({ itemType: 1, items: [] }, context)).toBe(0)
    expect(action.animationData).toBeUndefined()
  })
})
