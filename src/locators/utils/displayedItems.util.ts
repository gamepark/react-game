import { MaterialItem } from '@gamepark/rules-api'

/**
 * Records the items array currently on screen, for each item type.
 *
 * Locators are handed a game state they cannot identify: on top of the state being displayed, animations
 * build deep copies of it to work out where a move leads ({@link ItemAnimations.getPreMoveSiblingAnimation},
 * {@link MoveItemAnimations.getMovedItemAnimation}). Those copies have the moving item already gone from
 * where it still stands on the table, so anything that drops memoized state must first make sure it is not
 * looking at one of them.
 *
 * {@link DynamicItemsDisplay} is the single writer, once per render and per type.
 */
class DisplayedItems {
  private items = new Map<number, MaterialItem[]>()

  /**
   * Record the items being displayed for one type.
   * @param type The item type
   * @param items The items of that type in the state being rendered
   */
  track(type: number, items: MaterialItem[]) {
    this.items.set(type, items)
  }

  /**
   * @param type The item type
   * @param items The items of that type in the state the caller is looking at
   * @returns true if that array is the one being displayed, false if it is a copy an animation is simulating on
   */
  isDisplayed(type: number, items?: MaterialItem[]): boolean {
    return items !== undefined && this.items.get(type) === items
  }
}

/**
 * Tells the state being displayed apart from the copies animations simulate on. See {@link DisplayedItems}.
 */
export const displayedItems = new DisplayedItems()
