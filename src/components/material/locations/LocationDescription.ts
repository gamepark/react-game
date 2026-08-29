import { Interpolation, Theme } from '@emotion/react'
import {
  isCreateItem,
  isDeleteItem,
  isMoveItem,
  isMoveItemsAtOnce,
  Location,
  MaterialMove,
  MaterialMoveBuilder,
  MoveItem,
  MoveItemsAtOnce,
  XYCoordinates
} from '@gamepark/rules-api'
import { isEqual } from 'es-toolkit'
import { ComponentType, ElementType } from 'react'
import { LocationContext, MaterialContext } from '../../../locators'
import { ComponentDescription, ComponentSize } from '../ComponentDescription'
import { isLocationSubset } from '../utils'
import { isRotationMove } from '../utils/isRotationMove'
import { LocationComponent } from './LocationComponent'
import displayLocationHelp = MaterialMoveBuilder.displayLocationHelp

export class LocationDescription<P extends number = number, M extends number = number, L extends number = number, Id = any, R extends number = number, V extends number = number>
  extends ComponentDescription<Id> {

  constructor(clone?: Partial<Pick<LocationDescription, 'height' | 'width' | 'ratio' | 'borderRadius' | 'extraCss' | 'positionOnParent'>>) {
    super(clone)
    this.extraCss = clone?.extraCss
    this.positionOnParent = clone?.positionOnParent
  }

  Component: ElementType = LocationComponent

  ignoreCoordinates: boolean = false

  help?: ComponentType<LocationHelpProps<P, L>>

  getLocationSize(location: Location<P, L>, _context: MaterialContext<P, M, L, R, V>): ComponentSize {
    return this.getSize(location.id)
  }

  /**
   * Where the area of the location stands on its parent item, in percentage of the parent's size, when that
   * differs from where the locator puts the items the location holds. Use {@link getPositionOnParent} to
   * provide a dynamic position.
   *
   * {@link Locator.getPositionOnParent} answers a different question: it says where one *item* of the location
   * stands, which is a point - the centre of a pawn, of a card. An area is a box, and the two coincide only
   * while the box is the size of what it holds. A drop area drawn the size of the whole parent item is the
   * plainest counter-example: it covers the parent, so it is centred on it ({x: 50, y: 50}), whatever spot of
   * that parent the items themselves are placed on.
   *
   * Undefined, the default, means the two do coincide and the locator has the answer.
   */
  positionOnParent?: XYCoordinates

  /**
   * See {@link positionOnParent}.
   *
   * @param _location The location
   * @param _context Context of the game
   * @returns the position of the area on its parent item, or undefined to follow the locator
   */
  getPositionOnParent(_location: Location<P, L>, _context: MaterialContext<P, M, L, R, V>): XYCoordinates | undefined {
    return this.positionOnParent
  }

  image?: string
  images?: Record<Id extends keyof any ? Id : never, string>

  getImage(location: Location<P, L>, _context: MaterialContext<P, M, L, R, V>): string | undefined {
    return this.images?.[location.id as keyof typeof this.images] ?? this.image
  }

  helpImage?: string

  getHelpImage(location: Location<P, L>, context: MaterialContext<P, M, L, R, V>): string | undefined {
    return this.helpImage ?? this.getImage(location, context)
  }

  getImages(): string[] {
    const images: string[] = []
    if (this.image) images.push(this.image)
    if (this.images) images.push(...Object.values(this.images) as string[])
    if (this.helpImage) images.push(this.helpImage)
    return images
  }

  extraCss?: Interpolation<Theme>

  getExtraCss(_location: Location<P, L>, _context: LocationContext<P, M, L, R, V>): Interpolation<Theme> {
    return this.extraCss
  }

  getLocationTransform(location: Location<P, L>, context: LocationContext<P, M, L, R, V>): string[] {
    const transform = ['translate(-50%, -50%)']
    const locator = context.locators[location.type]
    if (locator) transform.push(...locator.placeLocation(location, context))
    return transform
  }

  highlight?(location: Location<P, L>, context: MaterialContext<P, M, L, R, V>): boolean | undefined

  content?: ComponentType<{ location: Location }>

  canLongClick(move: MaterialMove<P, M, L, R, V>, location: Location<P, L>, context: MaterialContext<P, M, L, R, V>): boolean {
    return this.isMoveToLocation(move, location, context)
  }

  placeOnShortClick: boolean = false

  canShortClick(move: MaterialMove<P, M, L, R, V>, location: Location<P, L>, context: MaterialContext<P, M, L, R, V>): boolean {
    return this.placeOnShortClick && (
      this.isMoveToLocation(move, location, context)
      || (isCreateItem(move) && isLocationSubset(move.item.location, location))
    )
  }

  isMoveToLocation(move: MaterialMove<P, M, L, R, V>, location: Location<P, L>, context: MaterialContext<P, M, L, R, V>) {
    return (isMoveItem(move) && isLocationSubset(this.getMoveLocation(move, context), location) && !isRotationMove(move, context)
    ) || (
      isDeleteItem(move) && isEqual(location, context.material[move.itemType]?.getStockLocation(
        context.rules.material(move.itemType).getItem(move.itemIndex)!, context)
      )
    ) || (isMoveItemsAtOnce(move) && isLocationSubset(this.getMoveLocation(move, context), location))
  }

  getMoveLocation(move: MoveItem<P, M, L> | MoveItemsAtOnce<P, M, L>, context: MaterialContext<P, M, L, R, V>): Location<P, L> {
    const itemIndex = isMoveItem(move) ? move.itemIndex : move.indexes[0]
    const type = move.location.type ?? context.rules.material(move.itemType).getItem(itemIndex).location.type
    return { type, ...move.location }
  }

  getShortClickMove(_location: Location<P, L>, _context: MaterialContext<P, M, L, R, V>): MaterialMove<P, M, L, R, V> | undefined {
    return undefined
  }

  getShortClickLocalMove(_location: Location<P, L>, _context: MaterialContext<P, M, L, R, V>): MaterialMove<P, M, L, R, V> | undefined {
    return undefined
  }

  displayInParentItemHelp?: boolean

  /**
   * The move to execute in order to display the help dialog about this location.
   * By default, open the help about this specific location, but can be overloaded for any other behavior.
   * @param location The location
   * @param _context Context of the game
   * @return The move to play to open the help dialog, if any
   */
  displayHelp(location: Location<P, L>, _context: MaterialContext<P, M, L, R, V>): MaterialMove<P, M, L, R, V> | undefined {
    return this.help && displayLocationHelp(location)
  }
}

export type LocationHelpProps<P extends number = number, L extends number = number> = {
  location: Location<P, L>
  closeDialog: () => void
}
