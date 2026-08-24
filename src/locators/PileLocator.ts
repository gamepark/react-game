import { Coordinates, Location, MaterialItem, XYCoordinates } from '@gamepark/rules-api'
import { CardDescription, DropAreaDescription, LocationDescription } from '../components'
import { getItemFromContext, ItemContext, Locator, MaterialContext } from './Locator'
import { displayedItems } from './utils'

/**
 * This Locator places items in a disorganised pile.
 */
export class PileLocator<P extends number = number, M extends number = number, L extends number = number, R extends number = number, V extends number = number> extends Locator<P, M, L, R, V> {

  constructor(clone?: Partial<PileLocator>) {
    super()
    Object.assign(this, clone)
  }

  /**
   * Random position and rotation drawn for each item of each pile, so that an item does not jump around
   * every time the pile is re-rendered. Both are memoized per pile, on the key returned by {@link getItemKey}.
   */
  private positions = new Map<string, Map<string, XYCoordinates>>()
  private rotations = new Map<string, Map<string, number>>()

  /**
   * Items dragged out of a pile, per item type and index, waiting for the move to apply. See {@link syncDroppedItems}.
   */
  private droppedItems = new Map<string, DroppedFromPile>()

  /**
   * Key an item is memoized on inside its pile.
   *
   * The display index is kept apart from the item index rather than summed with it: `index + displayIndex`
   * gave the same key to the 2nd unit of item 3 and to the 1st unit of item 4, which then piled up on the
   * exact same spot.
   *
   * The key must depend on nothing but the displayed item, never on the state it is read from: animations ask
   * for the position an item will have in a state where the move is already applied (see
   * {@link ItemAnimations.getPreMoveSiblingAnimation}), and a key that differs there would draw a brand new
   * position, ie send the item flying to a random spot for the whole animation.
   *
   * @param context Context of the item
   * @returns the key the item's position and rotation are memoized on
   */
  protected getItemKey(context: ItemContext<P, M, L, R, V>): string {
    return itemKey(context.type, context.index, context.displayIndex)
  }

  /**
   * By default, a maximum of 20 items are displayed
   */
  limit? = 20

  /**
   * Maximum dispersion radius of the items.
   */
  radius: number | XYCoordinates = 0

  /**
   * Function to override to provide a {@link radius} that depends on the context
   * @param _location Location to position
   * @param _context Context of the game
   * @returns the maximum dispersion radius of the items.
   */
  getRadius(_location: Location<P, L>, _context: MaterialContext<P, M, L, R, V>): number | XYCoordinates {
    return this.radius
  }

  /**
   * Maximum angle of rotation of the items. Defaults to 180, bidirectional so items can have any rotation.
   */
  maxAngle = 180

  /**
   * Function to override to provide a {@link maxAngle} that depends on the context
   * @param _location Location to position
   * @param _context Context of the game
   * @returns the maximum angle of rotation of the items
   */
  getMaxAngle(_location: Location<P, L>, _context: MaterialContext<P, M, L, R, V>): number {
    return this.maxAngle
  }

  /**
   * When true, the z-index is derived from the item's Y offset instead of the item index.
   * Items with a higher Y appear on top, simulating depth perspective.
   */
  zFromY = false

  minimumDistance = 0

  /**
   * Identifier of the pile. By default, distinct location areas (different player, id or parent) forms distinct piles.
   * @param item Item to position
   * @param _context Context of the item
   * @returns a unique identifier for the pile of items this location goes to
   */
  getPileId(item: MaterialItem<P, L>, _context: ItemContext<P, M, L, R, V>): string {
    return [item.location.player, item.location.id, item.location.parent].filter(part => part !== undefined).join('_')
  }

  getPositionDependencies(location: Location<P, L>, context: MaterialContext<P, M, L, R, V>): unknown {
    return this.countItems(location, context)
  }

  getItemCoordinates(item: MaterialItem<P, L>, context: ItemContext<P, M, L, R, V>): Partial<Coordinates> {
    const location = item.location
    const index = this.getItemIndex(item, context)
    const key = this.getItemKey(context)
    const pileId = this.getPileId(item, context)
    this.syncDroppedItems(item, context, pileId)
    if (!this.positions.has(pileId)) this.positions.set(pileId, new Map())
    const pilePositions = this.positions.get(pileId)!
    const { x = 0, y = 0, z = 0 } = this.getCoordinates(location, context)
    if (!pilePositions.has(key)) {
      this.cleanUpPile(pileId, context)
      let loopLimit = 100
      do {
        pilePositions.set(key, this.generateItemPosition(item, context))
      } while (--loopLimit > 0 && this.itemIsTooCloseToAnotherOne(pilePositions, key))
      if (loopLimit === 0) {
        console.warn('Could not generate a position far enough from every other items in PileLocator after 100 attempts!')
      }
    }
    const itemPosition = pilePositions.get(key)!
    const radius = this.getRadius(location, context)
    const maxRadius = typeof radius === 'number' ? radius : radius.y
    const itemZ = this.zFromY ? (maxRadius > 0 ? (itemPosition.y + maxRadius) / (2 * maxRadius) : 0) : index * 0.05
    return { x: x + itemPosition.x, y: y + itemPosition.y, z: z + itemZ }
  }

  generateItemPosition(item: MaterialItem<P, L>, context: ItemContext<P, M, L, R, V>) {
    const distance = Math.random()
    const direction = Math.random() * 2 * Math.PI
    const radius = this.getRadius(item.location, context)
    return {
      x: Math.cos(direction) * Math.sqrt(distance) * (typeof radius === 'number' ? radius : radius.x),
      y: Math.sin(direction) * Math.sqrt(distance) * (typeof radius === 'number' ? radius : radius.y)
    }
  }

  /**
   * Free the spot the player dragged from, instead of the spot of the last item drawn in the pile.
   *
   * A stack of N identical units is a single item of quantity N, displayed as N slots keyed on their display
   * index: rules-api only ever knows the quantity, so when one unit leaves, the slot that disappears is the
   * last one. Every other slot keeps its memoized position, so the item that vanishes from the table is the
   * one that happened to be drawn last, not the one that was just dragged away.
   *
   * The display index that was dragged is only known before the move applies - rules-api drops it from
   * `game.droppedItems` as soon as it does - so it is recorded while it passes by, then consumed on the render
   * where the quantity has decreased: the slots that are gone hand their position over to the slots that were
   * dropped, which leaves the pile with exactly the spots the player dragged from freed.
   *
   * @param item Item being positioned
   * @param context Context of the item
   * @param pileId Identifier of the pile the item is in, see {@link getPileId}
   */
  protected syncDroppedItems(item: MaterialItem<P, L>, context: ItemContext<P, M, L, R, V>, pileId: string) {
    if (!displayedItems.isDisplayed(context.type, context.rules.game.items[context.type])) return
    const key = `${context.type}_${context.index}`
    const displayIndexes = (context.rules.game.droppedItems ?? [])
      .filter(droppedItem => droppedItem.type === context.type && droppedItem.index === context.index)
      .map(droppedItem => droppedItem.displayIndex)
    if (displayIndexes.length) {
      this.droppedItems.set(key, { pileId, displayIndexes, quantity: item.quantity ?? 1 })
    } else {
      const droppedFromPile = this.droppedItems.get(key)
      // A pending drop lives for one state transition only: the one that applies the move, and removes it from
      // the game state. Anything else (a cancelled drag, a rejected move) simply drops it without a trace.
      if (droppedFromPile === undefined) return
      this.droppedItems.delete(key)
      if (droppedFromPile.pileId === pileId) this.freeDroppedSpots(droppedFromPile, item.quantity ?? 1, context)
    }
  }

  private freeDroppedSpots(droppedFromPile: DroppedFromPile, quantity: number, { type, index }: ItemContext<P, M, L, R, V>) {
    const { pileId, displayIndexes, quantity: previousQuantity } = droppedFromPile
    if (quantity >= previousQuantity) return // the whole item moved, or nothing left the pile: no slot to renumber
    const pilePositions = this.positions.get(pileId)
    const pileRotations = this.rotations.get(pileId)
    const goneKeys: string[] = []
    for (let displayIndex = quantity; displayIndex < previousQuantity; displayIndex++) {
      goneKeys.push(itemKey(type, index, displayIndex))
    }
    let goneIndex = 0
    for (const displayIndex of [...displayIndexes].sort((a, b) => a - b)) {
      // A dropped slot that is gone on its own frees its spot without any help
      if (displayIndex >= quantity || goneIndex >= goneKeys.length) continue
      const goneKey = goneKeys[goneIndex++]
      const droppedKey = itemKey(type, index, displayIndex)
      const position = pilePositions?.get(goneKey)
      if (position !== undefined) pilePositions!.set(droppedKey, position)
      const rotation = pileRotations?.get(goneKey)
      if (rotation !== undefined) pileRotations!.set(droppedKey, rotation)
    }
    for (const goneKey of goneKeys) {
      pilePositions?.delete(goneKey)
      pileRotations?.delete(goneKey)
    }
  }

  /**
   * Drop the memoized position and rotation of every item that is no longer in the pile.
   *
   * Entries are only ever added, never replaced, so without this sweep the maps grow for the whole session,
   * and {@link itemIsTooCloseToAnotherOne} keeps steering newcomers away from the spots of items that left
   * the pile long ago - until the 100 attempts run out and the item lands anywhere.
   *
   * Run right before a new entry is drawn, which is the only moment the maps grow, and only on the state
   * being displayed: the future states animations simulate already have the moving item out of the pile, so
   * sweeping on one of those would drop the entry of an item still standing on the table, which would then
   * be redrawn somewhere else the instant the animation ends.
   *
   * @param pileId Identifier of the pile to sweep, see {@link getPileId}
   * @param context Context of the item the new entry is drawn for
   */
  protected cleanUpPile(pileId: string, context: ItemContext<P, M, L, R, V>) {
    if (!displayedItems.isDisplayed(context.type, context.rules.game.items[context.type])) return
    const pilePositions = this.positions.get(pileId)
    const pileRotations = this.rotations.get(pileId)
    if (!pilePositions?.size && !pileRotations?.size) return
    const pileKeys = this.getPileItemKeys(pileId, context)
    for (const key of [...pilePositions?.keys() ?? []]) {
      if (!pileKeys.has(key)) pilePositions!.delete(key)
    }
    for (const key of [...pileRotations?.keys() ?? []]) {
      if (!pileKeys.has(key)) pileRotations!.delete(key)
    }
  }

  /**
   * Keys of every item currently in a pile, ie the entries {@link cleanUpPile} must keep.
   *
   * Membership is decided by {@link getPileId} alone, the same way {@link getItemCoordinates} decides which
   * pile an item goes to: a locator that merges several location areas into one pile keeps working, and the
   * worst a surprising override can do is leave an extra entry in the maps, never wipe a live one.
   *
   * @param pileId Identifier of the pile
   * @param context Context of the game
   * @returns the keys of the items in that pile
   */
  protected getPileItemKeys(pileId: string, context: ItemContext<P, M, L, R, V>): Set<string> {
    const keys = new Set<string>()
    for (const type of this.itemTypes) {
      const items: (MaterialItem<P, L> | undefined)[] = context.rules.game.items[type] ?? []
      // Static items (see StaticItemsDisplay) are indexed in a space of their own, and are never deleted nor
      // moved: they are enumerated too, otherwise the sweep would drop them right after they were drawn. Both
      // spaces share the same keys, which at worst leaves a dead entry in the maps, never wipes a live one.
      const staticItems: (MaterialItem<P, L> | undefined)[] = context.material[type]?.getStaticItems(context) ?? []
      for (const [index, item] of [...items.entries(), ...staticItems.entries()]) {
        const quantity = item?.quantity ?? 1
        if (!item || quantity === 0) continue
        for (let displayIndex = 0; displayIndex < quantity; displayIndex++) {
          const itemContext = { ...context, type, index, displayIndex }
          if (this.getPileId(item, itemContext) === pileId) keys.add(this.getItemKey(itemContext))
        }
      }
    }
    return keys
  }

  itemIsTooCloseToAnotherOne(pilePositions: Map<string, XYCoordinates>, itemKey: string) {
    if (!this.minimumDistance) return false
    const itemPosition = pilePositions.get(itemKey)!
    for (const [key, { x, y }] of pilePositions) {
      if (key !== itemKey && Math.sqrt(Math.pow((itemPosition.x - x), 2) + Math.pow((itemPosition.y - y), 2)) < this.minimumDistance) {
        return true
      }
    }
    return false
  }

  getItemRotateZ(item: MaterialItem<P, L>, context: ItemContext<P, M, L, R, V>): number {
    const key = this.getItemKey(context)
    const pileId = this.getPileId(item, context)
    this.syncDroppedItems(item, context, pileId)
    if (!this.rotations.has(pileId)) this.rotations.set(pileId, new Map())
    const pileRotations = this.rotations.get(pileId)!
    if (!pileRotations.has(key)) {
      this.cleanUpPile(pileId, context)
      const maxAngle = this.getMaxAngle(item.location, context)
      pileRotations.set(key, (Math.random() - 0.5) * maxAngle)
    }
    return this.getRotateZ(item.location, context) + pileRotations.get(key)!
  }

  protected generateLocationDescriptionFromDraggedItem(location: Location<P, L>, context: ItemContext<P, M, L, R, V>): LocationDescription<P, M, L> {
    const itemDescription = context.material[context.type] ?? new CardDescription()
    const item = getItemFromContext(context)
    const { width, height } = itemDescription.getSize(item.id)
    if (this.getMaxAngle(location, context) < 180) {
      return new DropAreaDescription(itemDescription)
    } else {
      const max = Math.max(width, height)
      const radius = this.getRadius(location, context)
      return new DropAreaDescription({
        width: max + (typeof radius === 'number' ? radius * 2 : radius.x * 2),
        height: max + (typeof radius === 'number' ? radius * 2 : radius.y * 2),
        borderRadius: max / 2 + (typeof radius === 'number' ? radius : Math.max(radius.x, radius.y))
      })
    }
  }
}

/**
 * An item dragged out of a pile, recorded until the move applies. See {@link PileLocator.syncDroppedItems}.
 */
type DroppedFromPile = {
  /** Pile the item was dragged from */
  pileId: string
  /** Display indexes dragged away */
  displayIndexes: number[]
  /** Quantity of the item at the time it was dropped */
  quantity: number
}

/**
 * Key an item is memoized on inside its pile. See {@link PileLocator.getItemKey}.
 */
function itemKey(type: number, index: number, displayIndex: number): string {
  return `${type}_${index}_${displayIndex}`
}

