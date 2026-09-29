// @vitest-environment jsdom
import { hideItemId, hideItemIdToOthers, MaterialItem } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { CardDescription, MaterialContext } from '../../..'

enum Location { Deck = 1, Hand, Table }

class TestCard extends CardDescription {
  backImage = 'back.jpg'
  images = { 1: 'front.jpg' }
}

const card = new TestCard()
const context = { rules: { hidingStrategies: { 1: { [Location.Deck]: hideItemId, [Location.Hand]: hideItemIdToOthers } } }, material: { 1: card }, locators: {}, player: 1 } as unknown as MaterialContext
const item = (location: MaterialItem['location'], id?: number): MaterialItem => ({ id, location })

describe('FlatMaterialDescription.isFlippedOnTable', () => {
  it('shows the back of an item without id', () => {
    expect(card.isFlippedOnTable(item({ type: Location.Table }), context)).toBe(true)
  })

  it('shows the front of an item whose id is not hidden', () => {
    expect(card.isFlippedOnTable(item({ type: Location.Table }, 1), context)).toBe(false)
    expect(card.isFlippedOnTable(item({ type: Location.Hand, player: 1 }, 1), context)).toBe(false)
  })

  it('keeps the back of revealed items where the rules hide them, as after the game is over', () => {
    expect(card.isFlippedOnTable(item({ type: Location.Deck }, 1), context)).toBe(true)
    expect(card.isFlippedOnTable(item({ type: Location.Hand, player: 2 }, 1), context)).toBe(true)
    expect(card.isFlippedOnTable(item({ type: Location.Hand, player: 2 }, 1), { ...context, type: 1, index: 0, displayIndex: 0 } as MaterialContext)).toBe(true)
  })

  it('shows the front of revealed items in the help dialog', () => {
    expect(card.isFlippedInDialog(item({ type: Location.Deck }, 1), context)).toBe(false)
  })
})
