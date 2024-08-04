/** @jsxImportSource @emotion/react */
import { Interpolation, Theme } from '@emotion/react'
import {
  isDeleteItem,
  isMoveItem,
  isRoll,
  isSelectItem,
  Location,
  MaterialHelpDisplay,
  MaterialItem,
  MaterialMove,
  MaterialMoveBuilder
} from '@gamepark/rules-api'
import { ComponentType, FC, HTMLAttributes } from 'react'
import { ItemContext, MaterialContext } from '../../locators'
import { ComponentDescription, ComponentSize } from './ComponentDescription'
import displayMaterialHelp = MaterialMoveBuilder.displayMaterialHelp

export type MaterialHelpProps<P extends number = number, M extends number = number, L extends number = number> = {
  closeDialog: () => void
} & Omit<MaterialHelpDisplay<P, M, L>, 'type'>

export type MaterialContentProps<ItemId = any> = {
  itemId: ItemId,
  highlight?: boolean
  playDown?: boolean
} & HTMLAttributes<HTMLElement>

/**
 * Base class to describe the material in a game
 */
export abstract class MaterialDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends ComponentDescription {
  /**
   * Content of the help dialog opened when an item is clicked
   */
  help?: ComponentType<MaterialHelpProps<P, M, L>>

  /**
   * The React component to display
   */
  abstract content: FC<MaterialContentProps<ItemId>>

  /**
   * If the component can be moved (token, cards...) or not (writing)
   */
  isMobile = false

  /**
   * See {@link getStaticItems}
   */
  staticItem?: MaterialItem<P, L>

  /**
   * See {@link getStaticItems}
   */
  staticItems: MaterialItem<P, L>[] = []

  /**
   * Return any items to display that are not part of the game state because they never move (board or unlimited stockpiles for instance).
   * Default value: {@link staticItem} if defined, otherwise {@link staticItems}. Override if the static items depends on the context.
   *
   * @param {MaterialContext} _context Context of the game
   * @returns {MaterialItem[]} the extra items to display
   */
  getStaticItems(_context: MaterialContext<P, M, L>): MaterialItem<P, L>[] {
    return this.staticItem ? [this.staticItem] : this.staticItems
  }

  /**
   * See {@link getStockLocation}
   */
  stockLocation?: Location<P, L>

  /**
   * If items are created of deleted, by default the animation will fade in or fade out the item quickly.
   * If you want to animate from/to a location (a stockpile for instance), implement this function or simply {@link stockLocation}.
   * @param _item Item that is getting created or deleted.
   * @param _context Context of the game
   * @returns The location to animate from/to
   */
  getStockLocation(_item: MaterialItem<P, L>, _context: MaterialContext<P, M, L>): Location<P, L> | undefined {
    return this.stockLocation
  }

  /**
   * See {@link getLocations}
   */
  location?: Location<P, L>

  /**
   * See {@link getLocations}
   */
  locations: Location<P, L>[] = []

  /**
   * The internal locations of the item, for instance the spots to put material on a board.
   * Will return {@link location} by default if defined, {@link locations} otherwise.
   *
   * @param _item The item that contains the locations
   * @param _context Context of the game
   */
  getLocations(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): Location<P, L>[] {
    return this.location ? [this.location] : this.locations
  }

  /**
   * This function determines if an item can currently be dragged by the user to perform a given move.
   *
   * @param _move The move to consider
   * @param _context Context of the item
   */
  canDrag(_move: MaterialMove<P, M, L>, _context: ItemContext<P, M, L>): boolean {
    return false
  }

  /**
   * This function determines if a move can be played by clicking for 1 second on an item
   *
   * @param move The move to consider
   * @param context Context of the item
   */
  canLongClick(move: MaterialMove<P, M, L>, { type, index }: ItemContext<P, M, L>): boolean {
    return (isMoveItem(move) || isDeleteItem(move) || isRoll(move)) && move.itemType === type && move.itemIndex === index
  }

  /**
   * This function determines if a move can be played by clicking on an item
   *
   * @param move The move to consider
   * @param context Context of the item
   */
  canShortClick(move: MaterialMove<P, M, L>, { type, index }: ItemContext<P, M, L>): boolean {
    return isSelectItem(move) && move.itemType === type && move.itemIndex === index
  }

  /**
   * This function returns the move that should be played when clicking on an item, if any
   *
   * @param _context Context of the item
   */
  getShortClickMove(_context: ItemContext<P, M, L>): MaterialMove<P, M, L> | undefined {
    return undefined
  }

  /**
   * This function returns the local move that should be played when clicking on an item, if any
   *
   * @param _context Context of the item
   */
  getShortClickLocalMove(_context: ItemContext<P, M, L>): MaterialMove<P, M, L> | undefined {
    return undefined
  }

  /**
   * Height of the item
   */
  height?: number

  /**
   * Width of the item
   */
  width?: number

  /**
   * Ratio (width/height) of the item
   */
  ratio?: number

  /**
   * Border radius of the item
   */
  borderRadius?: number

  /**
   * Returns the size of the item. Default will be process from {@link width}, {@link height} and {@link ratio}.
   * @param _itemId id of the item
   * @returns {ComponentSize} The size
   */
  getSize(_itemId: ItemId): ComponentSize {
    if (this.width && this.height) return { width: this.width, height: this.height }
    if (this.ratio && this.width) return { width: this.width, height: this.width / this.ratio }
    if (this.ratio && this.height) return { width: this.height * this.ratio, height: this.height }
    throw new Error('You must implement 2 of "width", "height" & "ratio" in any Material description')
  }

  /**
   * Returns the border radius of the item. Default to {@link borderRadius}
   * @param _itemId id of the item
   * @returns {number | undefined} The border radius
   */
  getBorderRadius(_itemId: ItemId): number | undefined {
    return this.borderRadius
  }

  /**
   * Thickness of the item
   */
  thickness = 0.05

  /**
   * Returns the thickness of the item. Default to {@link thickness}
   * @param _item the item
   * @param _context Context of the item
   * @returns {number} The thickness
   */
  getThickness(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): number {
    return this.thickness
  }

  /**
   * The css rotations to add to the item
   * @param _item the item
   * @param _context Context of the item
   * @returns Css rotations such as `[rotateY(180deg)]`
   */
  getRotations(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): string[] {
    return []
  }

  /**
   * Any extra css to add on the item
   * @param _item The item
   * @param _context Context of the item
   * @returns The css, using Emotion framework
   */
  getItemExtraCss(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): Interpolation<Theme> {
    return
  }

  /**
   * Whether the item should be highlighted
   * @param _item The item
   * @param _context Context of the item
   * @return true if the item should be highlighted
   */
  highlight(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): boolean | undefined {
    return
  }

  /**
   * The move to execute in order to display the help dialog about this item.
   * By default, open the help about this specific item, but it can be the help about the location of the item sometimes.
   * @param item The item
   * @param context Context of the item
   * @return The move to play to open the help dialog
   */
  displayHelp(item: MaterialItem<P, L>, { type, index, displayIndex }: ItemContext<P, M, L>) {
    return displayMaterialHelp(type, item, index, displayIndex)
  }
}

export type MaterialDescriptionRecord<P extends number = number, M extends number = number, L extends number = number> = Record<M, MaterialDescription<P, M, L>>


