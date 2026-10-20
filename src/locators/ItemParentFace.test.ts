// @ts-nocheck
/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
// Through the index of the package: importing the locator first breaks the cycle of its imports
import { Locator, ParentFace } from '../index'

const CARD = 1, TOKEN = 2
const card = { id: 1, location: { type: 1 } }

/** A card that may show its back, and a token laid on it */
const contextOf = (flipped: boolean, tokenLocator: Locator) => {
  const cardLocator = new Locator()
  cardLocator.coordinates = { x: 10, y: 0, z: 0 }
  const material = {
    [CARD]: { getSize: () => ({ width: 6, height: 8 }), getThickness: () => 0.05, getFaceRotation: () => (flipped ? 180 : 0) }
  }
  const rules = { material: (type) => ({ getItem: () => (type === CARD ? card : undefined) }), game: { items: { [CARD]: [card] } } }
  return { type: TOKEN, index: 0, displayIndex: 0, rules, material, locators: { 1: cardLocator, 2: tokenLocator }, player: 1 }
}

class TokenLocator extends Locator {
  parentItemType = CARD
  positionOnParent = { x: 50, y: 25 }
  getParentItem() {
    return card
  }
}

const token = { location: { type: 2, parent: 0 } }

describe('an item laid on a parent item', () => {
  it('stays up by default, whichever face of its parent is up', () => {
    const locator = new TokenLocator()
    expect(locator.placeItem(token, contextOf(false, locator)).join(' ')).not.toContain('rotateY')
    expect(locator.placeItem(token, contextOf(true, locator)).join(' ')).not.toContain('rotateY')
  })

  it('turns with its parent when it is laid on its front', () => {
    const locator = new TokenLocator()
    locator.itemParentFace = ParentFace.Front
    expect(locator.placeItem(token, contextOf(false, locator))).toContain('rotateY(0deg)')
    expect(locator.placeItem(token, contextOf(true, locator))).toContain('rotateY(180deg)')
  })

  it('is on the other side when it is laid on its back', () => {
    const locator = new TokenLocator()
    locator.itemParentFace = ParentFace.Back
    expect(locator.placeItem(token, contextOf(false, locator))).toContain('rotateY(180deg)')
    expect(locator.placeItem(token, contextOf(true, locator))).toContain('rotateY(360deg)')
  })

  it('writes the turn of the parent before its place on it, so that it goes round the axis of the parent', () => {
    const locator = new TokenLocator()
    locator.itemParentFace = ParentFace.Front
    const transforms = locator.placeItem(token, contextOf(true, locator))
    expect(transforms.findIndex((t) => t.startsWith('rotateY'))).toBeLessThan(transforms.findIndex((t) => t.includes('-2em')))
  })
})
