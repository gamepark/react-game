import { Interpolation, Theme } from '@emotion/react'
import { isCreateItem, isDeleteItem, isMoveItem, Location, MaterialMove, MaterialMoveBuilder } from '@gamepark/rules-api'
import isEqual from 'lodash/isEqual'
import { ComponentType, ElementType } from 'react'
import { LocationContext, MaterialContext } from '../../../locators'
import { ComponentDescription, ComponentSize } from '../ComponentDescription'
import { isLocationSubset } from '../utils'
import { isRotationMove } from '../utils/isRotationMove'
import { LocationComponent } from './LocationComponent'
import displayLocationHelp = MaterialMoveBuilder.displayLocationHelp

export class LocationDescription<P extends number = number, M extends number = number, L extends number = number, Id = any>
  extends ComponentDescription<Id> {

  constructor(clone?: Partial<Pick<LocationDescription, 'height' | 'width' | 'ratio' | 'borderRadius' | 'extraCss'>>) {
    super(clone)
    this.extraCss = clone?.extraCss
  }

  Component: ElementType = LocationComponent

  help?: ComponentType<LocationHelpProps<P, L>>

  getLocationSize(location: Location<P, L>, _context: MaterialContext<P, M, L>): ComponentSize {
    return this.getSize(location.id)
  }

  image?: string
  images?: Record<Id extends keyof any ? Id : never, string>

  getImage(location: Location<P, L>, _context: MaterialContext<P, M, L>): string | undefined {
    return this.images?.[location.id as keyof typeof this.images] ?? this.image
  }

  helpImage?: string

  getHelpImage(location: Location<P, L>, context: MaterialContext<P, M, L>): string | undefined {
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

  getExtraCss(_location: Location<P, L>, _context: LocationContext<P, M, L>): Interpolation<Theme> {
    return this.extraCss
  }

  getLocationTransform(location: Location<P, L>, context: LocationContext<P, M, L>): string[] {
    const transform = ['translate(-50%, -50%)']
    const locator = context.locators[location.type]
    if (locator) transform.push(...locator.placeLocation(location, context))
    return transform
  }

  highlight?(location: Location<P, L>, context: MaterialContext<P, M, L>): boolean | undefined

  content?: ComponentType<{ location: Location }>

  canLongClick(move: MaterialMove<P, M, L>, location: Location<P, L>, context: MaterialContext<P, M, L>): boolean {
    return this.isMoveToLocation(move, location, context)
  }

  placeOnShortClick: boolean = false

  canShortClick(move: MaterialMove<P, M, L>, location: Location<P, L>, context: MaterialContext<P, M, L>): boolean {
    return this.placeOnShortClick && (
      this.isMoveToLocation(move, location, context)
      || (isCreateItem(move) && isLocationSubset(move.item.location, location))
    )
  }

  isMoveToLocation(move: MaterialMove<P, M, L>, location: Location<P, L>, context: MaterialContext<P, M, L>) {
    return (isMoveItem(move) && isLocationSubset(move.location, location) && !isRotationMove(move, context)
    ) || (
      isDeleteItem(move) && isEqual(location, context.material[move.itemType]?.getStockLocation(
        context.rules.material(move.itemType).getItem(move.itemIndex)!, context)
      )
    )
  }

  getShortClickMove(_location: Location<P, L>, _context: MaterialContext<P, M, L>): MaterialMove<P, M, L> | undefined {
    return undefined
  }

  getShortClickLocalMove(_location: Location<P, L>, _context: MaterialContext<P, M, L>): MaterialMove<P, M, L> | undefined {
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
  displayHelp(location: Location<P, L>, _context: MaterialContext<P, M, L>): MaterialMove<P, M, L> | undefined {
    return this.help && displayLocationHelp(location)
  }
}

export type LocationHelpProps<P extends number = number, L extends number = number> = {
  location: Location<P, L>
  closeDialog: () => void
}
