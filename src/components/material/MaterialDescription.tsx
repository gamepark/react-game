import { css, Interpolation, Keyframes, Theme } from '@emotion/react'
import { faQuestion } from '@fortawesome/free-solid-svg-icons/faQuestion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  isDeleteItem,
  isMoveItem,
  isMoveItemsAtOnce,
  isRoll,
  isSelectItem,
  Location,
  MaterialHelpDisplay,
  MaterialItem,
  MaterialMove,
  MaterialMoveBuilder,
  MoveItem,
  MoveItemsAtOnce
} from '@gamepark/rules-api'
import { groupBy } from 'es-toolkit'
import { partition } from 'es-toolkit/compat'
import { TFunction } from 'i18next'
import { ComponentType, HTMLAttributes, ReactNode } from 'react'
import { Trans } from 'react-i18next'
import { getItemFromContext, ItemContext, Locator, MaterialContext } from '../../locators'
import { defaultElevation, getElevationKeyframes } from './animations'
import { ComponentDescription } from './ComponentDescription'
import { ItemButtonProps, ItemMenuButton } from './ItemMenuButton'
import displayMaterialHelp = MaterialMoveBuilder.displayMaterialHelp

export type MaterialHelpProps<P extends number = number, M extends number = number, L extends number = number> = {
  closeDialog: () => void
} & Omit<MaterialHelpDisplay<P, M, L>, 'type'>

export type MaterialContentProps<ItemId = any, M extends number = number> = {
  itemId: ItemId,
  itemIndex?: number
  type?: M
  highlight?: boolean
  playDown?: boolean
  preview?: boolean
} & HTMLAttributes<HTMLElement>

/**
 * Base class to describe the material in a game
 */
export abstract class MaterialDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends ComponentDescription<ItemId> {
  /**
   * Content of the help dialog opened when an item is clicked
   */
  help?: ComponentType<MaterialHelpProps<P, M, L>>

  /**
   * The React component to display
   */
  abstract content: (props: MaterialContentProps<ItemId>) => ReactNode

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
  canLongClick(move: MaterialMove<P, M, L>, context: ItemContext<P, M, L>): boolean {
    return (isMoveItem(move) || isDeleteItem(move) || isRoll(move)) && move.itemType === context.type && move.itemIndex === context.index
  }

  /**
   * This function determines if a move can be played by clicking on an item
   *
   * @param move The move to consider
   * @param context Context of the item
   */
  canShortClick(move: MaterialMove<P, M, L>, context: ItemContext<P, M, L>): boolean {
    return isSelectItem(move) && move.itemType === context.type && move.itemIndex === context.index
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
  displayHelp(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): MaterialMove<P, M, L> | undefined {
    const { type, index, displayIndex } = context
    return displayMaterialHelp(type, item, index, displayIndex)
  }

  /**
   * Builds the CSS transform that will be applied to the item.
   * @param item Item to position
   * @param context Context of the item
   * @returns {string[]} a list of CSS transformations
   */
  getItemTransform(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string[] {
    const transform = ['translate(-50%, -50%)']
    const locator = context.locators[item.location.type]
    if (locator) {
      transform.push(...locator.placeItem(item, context))
      if (locator.hide(item, context)) transform.push('scale(0)')
    }
    return transform
  }

  /**
   * Builds the CSS transform that will be applied to the item when hovered.
   * @param _item Item to position
   * @param _context Context of the item
   * @returns {string[]} a list of CSS transformations
   */
  getHoverTransform(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): string[] {
    return []
  }

  /**
   * Provide the locations that are required to drop an item given the legal moves that currently allow to drag the item.
   * @param context Context of the item. Use {@link getItemFromContext} to get the item from it.
   * @param dragMoves Legal moves filtered to only keep those that allows the item to be dragged
   * @return All the locations where the item can be dropped
   */
  getDropLocations(context: ItemContext<P, M, L>, dragMoves: MaterialMove<P, M, L>[]): Location<P, L>[] {
    const locations: Location<P, L>[] = []
    const [itemMoves, otherMoves] = partition(dragMoves, isMovementOfItem)
    const itemMovesByType = groupBy(itemMoves, (move) =>
      move.location.type ?? context.rules.material(move.itemType).getItem(isMoveItem(move) ? move.itemIndex : move.indexes[0]).location.type
    )
    for (const type in itemMovesByType) {
      const locator: Locator<P, M, L> | undefined = context.locators[parseInt(type) as L]
      if (locator) {
        locations.push(...locator.getDropLocations(itemMovesByType[type], context))
      } else {
        locations.push(...itemMovesByType[type].flatMap(move => this.getMoveDropLocations(context, move)))
      }
    }
    locations.push(...otherMoves.flatMap(move => this.getMoveDropLocations(context, move)))
    return locations
  }

  getMoveDropLocations(context: ItemContext<P, M, L>, move: MaterialMove<P, M, L>): Location<P, L>[] {
    if (isMoveItem(move) && move.location.type !== undefined) {
      return [move.location as Location<P, L>]
    } else if (isDeleteItem(move)) {
      const stockLocation = this.getStockLocation(getItemFromContext(context), context)
      return stockLocation ? [stockLocation] : []
    }
    return []
  }

  getTooltip(item: MaterialItem<P, L>, t: TFunction, _context: ItemContext<P, M, L>): string | null | undefined {
    if (item.quantity) return t('quantity.tooltip', { n: item.quantity, ns: 'common' })
    return
  }

  menuAlwaysVisible = false

  isMenuAlwaysVisible(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): boolean {
    return this.menuAlwaysVisible
  }

  getItemMenu(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>, _legalMoves: MaterialMove<P, M, L>[]): ReactNode {
    return
  }

  getHelpButton(item: MaterialItem<P, L>, context: ItemContext<P, M, L>, props: Partial<ItemButtonProps> = {}) {
    return <ItemMenuButton
      label={<Trans ns="common" i18nKey="Help"/>}
      move={this.displayHelp(item, context)}
      options={{ transient: true }}
      angle={30} {...props}>
      <FontAwesomeIcon icon={faQuestion}/>
    </ItemMenuButton>
  }

  getAnimationCss(animationKeyframes: Keyframes, duration: number): Interpolation<Theme> {
    const elevationArc = getElevationKeyframes(defaultElevation)
    return css`
      animation: ${elevationArc} ${duration}s ease-in-out forwards;

      > * {
        animation: ${animationKeyframes} ${duration}s ease-in-out forwards;
      }
    `
  }

  getHelpDisplayExtraCss(_item: Partial<MaterialItem<P, L>>, _context: ItemContext<P, M, L>): Interpolation<Theme> {
    return
  }
}

function isMovementOfItem<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is (MoveItem<P, M, L> | MoveItemsAtOnce<P, M, L>) {
  return isMoveItem(move) || isMoveItemsAtOnce(move)
}

export type MaterialDescriptionRecord<P extends number = number, M extends number = number, L extends number = number> = Record<M, MaterialDescription<P, M, L>>


