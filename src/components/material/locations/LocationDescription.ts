import { Interpolation, Theme } from '@emotion/react'
import { isCreateItem, isDeleteItem, isMoveItem, Location, MaterialMove } from '@gamepark/rules-api'
import isEqual from 'lodash/isEqual'
import { ComponentType } from 'react'
import { ItemContext, LocationContext, LocationHelpProps, MaterialContext } from '../../../locators'
import { ComponentDescription, ComponentSize } from '../ComponentDescription'
import { isLocationSubset } from '../utils'
import { isWritingDescription } from '../Writing'

export class LocationDescription<P extends number = number, M extends number = number, L extends number = number, Id = any>
  extends ComponentDescription<Id> {
  help?: ComponentType<LocationHelpProps<P, L>>

  getLocationSize(location: Location<P, L>, _context: MaterialContext<P, M, L>): ComponentSize {
    return this.getSize(location.id)
  }

  image?: string
  images?: Record<Id extends keyof any ? Id : never, string>

  getImage(location: Location<P, L>, _context: MaterialContext<P, M, L>): string | undefined {
    return this.images?.[location.id] ?? this.image
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

  alwaysVisible?: boolean

  isAlwaysVisible(location: Location<P, L>, context: MaterialContext<P, M, L>): boolean {
    if (this.alwaysVisible !== undefined) return this.alwaysVisible
    return context.locators[location.type]?.parentItemType !== undefined
  }

  highlight?(location: Location<P, L>, context: MaterialContext<P, M, L>): boolean | undefined

  content?: ComponentType<{ location: Location }>

  canDrop(move: MaterialMove<P, M, L>, location: Location<P, L>, context: ItemContext<P, M, L>): boolean {
    return this.isMoveToLocation(move, location, context)
  }

  getBestDropMove(moves: MaterialMove<P, M, L>[], _location: Location<P, L>, context: ItemContext<P, M, L>): MaterialMove<P, M, L> {
    const moveWithSameRotation = moves.find(move =>
      isMoveItem(move) && move.location.rotation === context.rules.material(move.itemType).getItem(move.itemIndex)?.location.rotation
    )
    return moveWithSameRotation ?? moves[0]
  }

  canLongClick(move: MaterialMove<P, M, L>, location: Location<P, L>, context: MaterialContext<P, M, L>): boolean {
    return this.isMoveToLocation(move, location, context)
  }

  canShortClick(move: MaterialMove<P, M, L>, location: Location<P, L>, context: MaterialContext<P, M, L>): boolean {
    return isCreateItem(move)
      && isLocationSubset(move.item.location, location)
      && context.material[move.itemType] && isWritingDescription(context.material[move.itemType]!)
  }

  isMoveToLocation(move: MaterialMove<P, M, L>, location: Location<P, L>, context: MaterialContext<P, M, L>) {
    return (isMoveItem(move) && isLocationSubset(move.location, location)
      && !isLocationSubset(context.rules.material(move.itemType).getItem(move.itemIndex)!.location, location)
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
}
