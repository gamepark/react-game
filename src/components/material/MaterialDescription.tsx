/** @jsxImportSource @emotion/react */
import { css, Interpolation, keyframes, Keyframes, Theme } from '@emotion/react'
import { faQuestion } from '@fortawesome/free-solid-svg-icons/faQuestion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  isDeleteItem,
  isMoveItem,
  isRoll,
  isSelectItem,
  LocalMoveType,
  Location,
  MaterialHelpDisplay,
  MaterialItem,
  MaterialMove,
  MaterialMoveBuilder,
  MoveKind
} from '@gamepark/rules-api'
import { TFunction } from 'i18next'
import groupBy from 'lodash/groupBy'
import partition from 'lodash/partition'
import { ComponentType, FC, HTMLAttributes, ReactNode, useEffect, useMemo } from 'react'
import { Trans } from 'react-i18next'
import { useLegalMoves, usePlay, useUndo } from '../../hooks'
import { getItemFromContext, ItemContext, Locator, MaterialContext } from '../../locators'
import { findIfUnique } from '../../utilities'
import { ComponentDescription } from './ComponentDescription'
import { ItemMenuButton } from './ItemMenuButton'
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
   * @deprecated Use the Item Menu instead
   * This function determines if a move can be played by clicking for 1 second on an item
   *
   * @param move The move to consider
   * @param context Context of the item
   */
  canLongClick(move: MaterialMove<P, M, L>, context: ItemContext<P, M, L>): boolean {
    return (isMoveItem(move) || isDeleteItem(move) || isRoll(move)) && move.itemType === context.type && move.itemIndex === context.index
  }

  /**
   * @deprecated Override getClickMoves instead
   * This function determines if a move can be played by clicking on an item
   *
   * @param move The move to consider
   * @param context Context of the item
   */
  canShortClick?(move: MaterialMove<P, M, L>, context: ItemContext<P, M, L>): boolean

  /**
   * @deprecated Override useOnClick instead or use the Item Menu
   * This function returns the move that should be played when clicking on an item, if any
   *
   * @param _context Context of the item
   */
  getShortClickMove(_context: ItemContext<P, M, L>): MaterialMove<P, M, L> | undefined {
    return undefined
  }

  /**
   * @deprecated Override useOnClick instead or use the Item Menu
   * This function returns the local move that should be played when clicking on an item, if any
   *
   * @param _context Context of the item
   */
  getShortClickLocalMove(_context: ItemContext<P, M, L>): MaterialMove<P, M, L> | undefined {
    return undefined
  }

  /**
   * Return the function that will be executed when an item is clicked.
   * This is a hook, so you can use hooks inside.
   *
   * @param context Context of the item
   */
  useOnClick(context: ItemContext<P, M, L>): (() => void) | undefined {
    const play = usePlay()
    const [undo, canUndo] = useUndo()
    const legalMoves = useLegalMoves<MaterialMove<P, M, L>>()
    const { type, index, rules } = context
    const item = getItemFromContext(context)

    const unselect = useMemo(() => {
      if (item.selected) {
        const predicate = (move: MaterialMove) => isSelectItem(move) && move.itemType === type && move.itemIndex === index && item.selected === (move.quantity ?? true)
        if (canUndo(predicate)) return () => undo(predicate)
      }
    }, [item, context, canUndo, undo])

    const clickMoves = useMemo(() => this.getClickMoves(item, context, legalMoves), [item, context, legalMoves])

    const canSelectToOpenMenu = useMemo(() => !unselect && clickMoves.length > 1, [unselect, clickMoves])

    useEffect(() => {
      if (!canSelectToOpenMenu && item.selected) {
        play(rules.material(type).index(index).unselectItem(), { transient: true })
      }
    }, [canSelectToOpenMenu])

    return useMemo(() => {
      if (clickMoves.length === 1) return () => play(clickMoves[0])
      if (unselect) return unselect
      const move = findIfUnique(legalMoves, move => this.canShortClick?.(move, context) ?? false)
      if (move !== undefined) return () => play(move)
      const shortClickMove = this.getShortClickMove(context)
      if (shortClickMove) return () => play(shortClickMove)
      const shortClickLocalMove = this.getShortClickLocalMove(context)
      if (shortClickLocalMove) return () => play(shortClickLocalMove, { local: true })
      if (canSelectToOpenMenu) {
        return () => {
          if (item.selected) {
            play(rules.material(type).index(index).unselectItem(), { transient: true })
          } else {
            play(rules.material(type).index(index).selectItem(), { transient: true })
            for (const unselectItem of rules.material(type).selected().unselectItems()) {
              play(unselectItem, { transient: true })
            }
          }
        }
      }
    }, [context, legalMoves, unselect, canSelectToOpenMenu])
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
  displayHelp(item: MaterialItem<P, L>, { type, index, displayIndex }: ItemContext<P, M, L>) {
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
    if (locator) transform.push(...locator.placeItem(item, context))
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
    const [itemMoves, otherMoves] = partition(dragMoves, isMoveItem)
    const itemMovesByType = groupBy(itemMoves, 'location.type')
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
    if (item.quantity) return t('quantity.tooltip', { n: item.quantity })
    return
  }

  /**
   * get the list of moves that can be played using clicks only.
   * If one move is returned, it will be played when the item is clicked.
   * If multiple moves are returned, the clicking the item will open the menu, which is generated based on that moves.
   * @param _item Item concerned
   * @param context Context of the item
   * @param legalMoves The current legal moves
   */
  getClickMoves(_item: MaterialItem<P, L>, context: ItemContext<P, M, L>, legalMoves: MaterialMove<P, M, L>[]): MaterialMove<P, M, L>[] {
    return legalMoves.filter(move => isSelectItem(move) && move.itemType === context.type && move.itemIndex === context.index)
  }

  /**
   * Return the menu to display around an item.
   * @param item Item concerned
   * @param context Context of the item
   * @param legalMoves The current legal moves
   */
  getItemMenu(item: MaterialItem<P, L>, context: ItemContext<P, M, L>, legalMoves: MaterialMove<P, M, L>[]): ReactNode {
    const moves = this.getClickMoves(item, context, legalMoves)
    if (moves.length > 1) {
      return <>
        {moves.map(move => {
          const Button = this.getMenuButton(move, context)
          return <Button key={JSON.stringify(move)}/>
        })}
      </>
    }
    return null
  }

  /**
   * Return the component that display a menu button to play the given move
   * @param move Move that will be played on click
   * @param _context Context of the item
   */
  getMenuButton(move: MaterialMove<P, M, L>, _context: ItemContext<P, M, L>): ComponentType {
    if (move.kind === MoveKind.LocalMove && move.type === LocalMoveType.DisplayHelp) {
      return () =>
        <ItemMenuButton label={<Trans defaults="Help"/>} move={move} options={{ transient: true }} angle={30}>
          <FontAwesomeIcon icon={faQuestion}/>
        </ItemMenuButton>
    }
    return () => null
  }

  getAnimationCss(keyframes: Keyframes, duration: number): Interpolation<Theme> {
    return css`
      animation: ${upAndDown} ${duration}s linear infinite;

      > * {
        animation: ${keyframes} ${duration}s ease-in-out forwards;
      }
    `
  }

  getHelpDisplayExtraCss(_item: Partial<MaterialItem<P, L>>, _context: ItemContext<P, M, L>): Interpolation<Theme> {
    return
  }
}

const upAndDown = keyframes`
  from, to {
    transform: none;
  }
  50% {
    transform: translateZ(10em);
  }
`

export type MaterialDescriptionRecord<P extends number = number, M extends number = number, L extends number = number> = Record<M, MaterialDescription<P, M, L>>


