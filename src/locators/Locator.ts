/** @jsxImportSource @emotion/react */
import { Coordinates, DeleteItem, DisplayedItem, isSameLocationArea, Location, MaterialItem, MaterialRules, MoveItem, XYCoordinates } from '@gamepark/rules-api'
import sumBy from 'lodash/sumBy'
import { DropAreaDescription, LocationDescription, MaterialDescriptionRecord } from '../components'

export type SortFunction = ((item: MaterialItem) => number)

/**
 * A Locator is responsible for placing item and locations (such as drop areas) on the Game Table.
 */
export class Locator<P extends number = number, M extends number = number, L extends number = number> {

  /**
   * With the constructor, you can create new locators in one line.
   * @example `new Locator({ coordinates: { x: -10, y: -5 } })`
   * @param clone Object to clone into the class
   */
  constructor(clone?: Partial<Locator>) {
    Object.assign(this, clone)
  }

  /**
   * Types of items placed by the locator since it was created
   * @internal
   * @protected
   */
  protected itemTypes: M[] = []

  /**
   * If the locator places items on top of another item (a game board for instance), the type of the parent item must be provided here.
   */
  parentItemType?: M

  /**
   * The maximum number of items do display.
   */
  limit?: number

  /**
   * The rotation unit to use. See {@link getRotateZ}
   */
  rotationUnit: string = 'deg'

  /**
   * Declare this field if you always need to display one location that does not depend on the context. See {@link getLocations}.
   */
  location?: Partial<Location<P, L>>

  /**
   * Declare this field if you always need to display some locations that does not depend on the context. See {@link getLocations}.
   */
  locations: Partial<Location<P, L>>[] = []

  /**
   * Override this if you need to display some locations on the Game Table that depends on the context.
   * By default, return any {@link location} or {@link locations}.
   */
  getLocations(_context: MaterialContext<P, M, L>): Partial<Location<P, L>>[] {
    return this.location ? [this.location] : this.locations
  }

  /**
   * If you need do display custom locations in the game, provide their description here.
   */
  locationDescription?: LocationDescription<P, M, L>

  /**
   * @internal
   * This function automatically create some drop location descriptions based on the context (dragged item, parent item).
   *
   * Do not override it but use {@link locationDescription},
   * otherwise the images of the location descriptions will not be preloaded by the {@link MaterialImageLoader}.
   */
  getLocationDescription(location: Location<P, L>, context: MaterialContext<P, M, L> | ItemContext<P, M, L>): LocationDescription<P, M, L> | undefined {
    if (!this.locationDescription) {
      if (this.parentItemType !== undefined && location.x === undefined && location.y === undefined && location.z === undefined) {
        const material = context.material[this.parentItemType]
        if (material) {
          this.locationDescription = new DropAreaDescription<P, M, L>(material)
        }
      } else if (isItemContext(context)) {
        return this.generateLocationDescriptionFromDraggedItem(location, context)
      }
    }
    return this.locationDescription
  }

  /**
   * @internal This function provides a custom location description for the current dragged item.
   */
  protected generateLocationDescriptionFromDraggedItem(_location: Location<P, L>, context: ItemContext<P, M, L>): LocationDescription<P, M, L> | undefined {
    return new DropAreaDescription(context.material[context.type])
  }

  /**
   * This function can hide some items on the game table depending on the context.
   * @param item The item
   * @param context The context of the item
   * @returns true if the item must be hidden
   */
  hide(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): boolean {
    return this.limit ? this.getItemIndex(item, context) >= this.limit : false
  }

  /**
   * Provide a list of css transform operations to place a location on the game table.
   * @param location Location to place
   * @param context Context of the location in the game
   * @returns the css transform that will be applied to the location
   */
  placeLocation(location: Location<P, L>, context: LocationContext<P, M, L>): string[] {
    const transform: string[] = []
    const { x = 0, y = 0, z = 0 } = this.getLocationCoordinates(location, context)
    if (x || y || z) {
      transform.push(`translate3d(${x}em, ${y}em, ${z}em)`)
    }
    const rotateZ = this.getRotateZ(location, context)
    if (rotateZ) {
      transform.push(`rotateZ(${rotateZ}${this.rotationUnit})`)
    }
    if (context.canDrop) transform.push('translateZ(5em)')
    return transform
  }

  /**
   * Provide a list of css transform operations to place an item on the game table.
   * @param item Item to place
   * @param context Context of the item in the game
   * @returns the css transform that will be applied to the item
   */
  placeItem(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string[] {
    if (!this.itemTypes.includes(context.type)) {
      this.itemTypes.push(context.type)
    }
    const transform = this.placeItemOnParent(item, context)
    const { x = 0, y = 0, z = 0 } = this.getItemCoordinates(item, context)
    if (x || y || z) {
      transform.push(`translate3d(${x}em, ${y}em, ${z}em)`)
    }
    const rotateZ = this.getItemRotateZ(item, context)
    if (rotateZ) {
      transform.push(`rotateZ(${rotateZ}${this.rotationUnit})`)
    }
    return transform
  }

  /**
   * Provide a list of css transform operations to place an item on a parent item.
   * @param item Item to place
   * @param context Context of the item in the game
   * @returns the css transform that will be applied to the item
   */
  protected placeItemOnParent(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string[] {
    const parentItem = this.getParentItem(item.location, context)
    if (this.parentItemType === undefined || !parentItem) return []
    const locator = context.locators[parentItem.location.type]
    const parentContext = { ...context, type: this.parentItemType, displayIndex: 0 }
    const transform = locator?.placeItem(parentItem, parentContext) ?? []
    const parentMaterial = context.material[this.parentItemType]
    const { x, y } = this.getPositionOnParent(item.location, context)
    if (parentMaterial && (x !== 0 || y !== 0)) {
      const { width, height } = parentMaterial.getSize(parentItem.id)
      transform.push(`translate3d(${width * (x - 50) / 100}em, ${height * (y - 50) / 100}em, ${parentMaterial.getThickness(parentItem, parentContext)}em)`)
    }
    return transform
  }

  /**
   * If a location belongs to an item, returns the item
   * @param location A location
   * @param context Context of the game
   * @returns the parent item of the location if any
   */
  getParentItem(location: Location<P, L>, { rules, material }: MaterialContext<P, M, L>): MaterialItem<P, L> | undefined {
    if (this.parentItemType === undefined) return undefined
    if (location.parent === undefined) return material[this.parentItemType]?.staticItem
    return rules.material(this.parentItemType).getItem(location.parent)
  }

  /**
   * Position of the location on the parent item, in percentage. Use {@link getPositionOnParent} to provide a dynamic position.
   */
  positionOnParent: XYCoordinates = { x: 50, y: 50 }

  /**
   * Place the center of the item in the plan of their parent item. This is ignored if "parentItemType" is undefined.
   * Examples: {x: 0, y: 0} places the center of the item in the top-left corner of the parent item
   * {x: 50, y: 50} centers the item in the parent item.
   *
   * @param _location Location of the item or area inside the parent item
   * @param _context THe material game context
   * @return {x, y} with "x" as a percentage from the parent's width, "y" a percentage of the height
   */
  getPositionOnParent(_location: Location<P, L>, _context: MaterialContext<P, M, L>): XYCoordinates {
    return this.positionOnParent
  }

  /**
   * Coordinates of the location on the Game Table. Use {@link getCoordinates} to provide dynamic coordinates.
   */
  coordinates: Partial<Coordinates> = { x: 0, y: 0, z: 0 }

  /**
   * Provide the coordinates of a location on the Game Table.
   *
   * Called by {@link getLocationCoordinates} but can be used as the Hand, List or Pile "initial" position in subclasses.
   *
   * @param _location Location to position
   * @param _context Context of the game
   * @returns the x, y, z coordinates (in cm) of the location
   */
  getCoordinates(_location: Location<P, L>, _context: MaterialContext<P, M, L>) {
    return this.coordinates
  }

  /**
   * Provide the coordinates of a location on the Game Table.
   *
   * Fallback to {@link getCoordinates} but the differences appear in subclasses {@link ListLocator}, {@link PileLocator}, {@link HandLocator}.
   *
   * @param location Location to position
   * @param context Context of the game
   * @returns the x, y, z coordinates (in cm) of the location
   */
  getLocationCoordinates(location: Location<P, L>, context: MaterialContext<P, M, L>): Partial<Coordinates> {
    return this.getCoordinates(location, context)
  }

  /**
   * Provide the coordinates of the center of an item on the Game Table.
   *
   * @param item Item being placed
   * @param context Context of the item in the game
   * @return The x, y, z coordinates in cm of the center of the item on the table
   */
  getItemCoordinates(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): Partial<Coordinates> {
    return this.getLocationCoordinates(item.location, context)
  }

  /**
   * The default Z-axis rotation of the items or locations to place if {@link getRotateZ} is not overridden.
   */
  rotateZ: number = 0

  /**
   * Get the Z-axis rotation of a location.
   * @param _location Location to place
   * @param _context Context of the location
   * @returns the rotation (unit in {@link rotationUnit})
   */
  getRotateZ(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number {
    return this.rotateZ
  }

  /**
   * Get the Z-axis rotation of an item. Defaults to {@link getRotateZ}.
   * @param item item to place
   * @param context Context of the item
   * @returns the rotation (unit in {@link rotationUnit})
   */
  getItemRotateZ(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): number {
    return this.getRotateZ(item.location, context)
  }

  /**
   * The index of a location to place, if it matters in the locator's context (see {@link HandLocator}, {@link ListLocator} or {@link PileLocator}).
   *
   * Defaults to location.x first, y otherwise, z last.
   *
   * @param location Location to index in the location area (see {@link isSameLocationArea})
   * @param _context Context of the game
   * @returns the index of the location in the location area
   */
  getLocationIndex(location: Location<P, L>, _context: MaterialContext<P, M, L>): number | undefined {
    return location.x ?? location.y ?? location.z
  }

  /**
   * Index of an item to place (fallback to {@link getLocationIndex} or item's displayIndex).
   * @param item Item to place
   * @param context Context of the item
   * @returns the index of the item in the location area
   */
  getItemIndex(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): number {
    return this.getLocationIndex(item.location, context) ?? context.displayIndex
  }

  /**
   * The total number of items in the same location area (see {@link isSameLocationArea}).
   *
   * @param location the location area
   * @param context Context of the game
   * @returns the total number of items in the location area
   */
  countItems(location: Location<P, L>, { rules }: MaterialContext<P, M, L>): number {
    return sumBy(this.itemTypes, type => rules.material(type).location(itemLocation => isSameLocationArea(itemLocation, location)).getQuantity())
  }

  /**
   * Any css transform to apply to the item when it is hovered by the pointer. See {@link HandLocator} override for example.
   * @param _item The item
   * @param _context Context of the item
   * @returns the list of css transforms
   */
  getHoverTransform(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): string[] {
    return []
  }

  /**
   * How items in the same location area are sorted for the help dialog navigation arrows.
   */
  navigationSorts: SortFunction[] = [(item) => item.location.x ?? 0, (item) => item.location.y ?? 0, (item) => item.location.z ?? 0]

  /**
   * How items in the same location area are sorted for the help dialog navigation arrows.
   * @param _context Context of the game
   * @returns The list of sort functions to sort the items.
   */
  getNavigationSorts(_context: ItemContext<P, M, L>): SortFunction[] {
    return this.navigationSorts
  }

  /**
   * Utility function for animation to know if the item is one that should be animated.
   * @param item Item to consider
   * @param context Context of the Item
   * @param move Move to animate
   * @returns true if the items must be animated
   */
  isItemToAnimate(item: MaterialItem<P, L>, context: ItemContext<P, M, L>, move: MoveItem<P, M, L> | DeleteItem<M>): boolean {
    const { rules, type, index, displayIndex } = context
    if (move.itemType !== type || move.itemIndex !== index) return false
    const quantity = item.quantity ?? 1
    const movedQuantity = move.quantity ?? 1
    if (quantity === movedQuantity) return true
    // If we move only a part of the quantity, we need to find which displayed items should move
    const droppedItem = rules.game.droppedItem
    let itemsNotMoving = this.limit ? Math.min(quantity, this.limit) - movedQuantity : quantity - movedQuantity
    if (droppedItem?.type === type && droppedItem.index === index) {
      const droppedIndex = droppedItem.displayIndex
      if (displayIndex === droppedIndex) return true
      if (droppedIndex < itemsNotMoving) itemsNotMoving++
    }
    return this.getItemIndex(item, context) >= itemsNotMoving
  }

  /**
   * Given an item being dragged, and all the moves for this item going to this location type, this function must return the list of valid drop locations
   * for the item
   * @param moves Legal movements for the item
   * @param _context Context of the item
   * @return the drop locations to display
   */
  getDropLocations(moves: MoveItem<P, M, L>[], _context: ItemContext<P, M, L>): Location<P, L>[] {
    return moves.map(move => move.location as Location<P, L>)
  }

  /**
   * If set to true, each time an item is dragged over
   */
  dropPreview: boolean = false

  /**
   * If this function returns true, a preview of the dragged item will be displayed when it is over this location.
   * @param _move The move that will be played if the item is dropped
   * @param _context Context of the game
   * @return true if a preview must be displayed
   */
  showDropPreview(_move: MoveItem<P, M, L>, _context: MaterialContext<P, M, L>): boolean {
    return this.dropPreview
  }
}

/**
 * A record of item locators, to provide to the game context.
 */
export type ItemLocatorRecord<P extends number = number, M extends number = number, L extends number = number> = Record<L, Locator<P, M, L>>

/**
 * Data structure for the context of a game displayed.
 * @property rules The rules of the game with current game state.
 * @property material The record of the material descriptions to display the items.
 * @property locators The record of the locators to place the items.
 * @property player The player currently displaying the game. Undefined for spectators.
 */
export type MaterialContext<P extends number = number, M extends number = number, L extends number = number> = {
  rules: MaterialRules<P, M, L>
  material: Partial<MaterialDescriptionRecord<P, M, L>>
  locators: Partial<ItemLocatorRecord<P, M, L>>
  player?: P
}

/**
 * Data structure for the context of an item in a game displayed.
 * @property dragTransform The CSS translate operation applied to the item, if any.
 */
export type ItemContext<P extends number = number, M extends number = number, L extends number = number> = MaterialContext<P, M, L> & DisplayedItem<M> & {
  dragTransform?: string
}

/**
 * Type guard to test if some MaterialContext is also an item context.
 * @param context Context of the game
 * @returns true if the context also hold information about a specific item in the game.
 */
export function isItemContext<P extends number = number, M extends number = number, L extends number = number>(
  context: MaterialContext<P, M, L>
): context is ItemContext<P, M, L> {
  const itemContext = context as ItemContext<P, M, L>
  return itemContext.type !== undefined && itemContext.index !== undefined && itemContext.displayIndex !== undefined
}

/**
 * Help function to get an item from an ItemContext
 * @param context Context of the item
 * @return The item
 */
export function getItemFromContext<Id = any, P extends number = number, M extends number = number, L extends number = number>(
  context: ItemContext<P, M, L>
): MaterialItem<P, L, Id> {
  return context.rules.material(context.type).getItem<Id>(context.index)
}

/**
 * Context of a location in a displayed game.
 * @property canDrop Whether some item is currently being dragged, and can be dropped in the location.
 */
export type LocationContext<P extends number = number, M extends number = number, L extends number = number> = MaterialContext<P, M, L> & {
  canDrop?: boolean
}
