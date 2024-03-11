import { Interpolation, Theme } from '@emotion/react'
import { Coordinates, isCreateItem, isDeleteItem, isMoveItem, Location, MaterialMove } from '@gamepark/rules-api'
import equal from 'fast-deep-equal'
import { ComponentType } from 'react'
import { ItemContext, LocationContext, LocationHelpProps, MaterialContext } from '../../../locators'
import { ComponentSize } from '../MaterialDescription'
import { isLocationSubset } from '../utils'
import { isWritingDescription } from '../Writing'

export class LocationDescription<P extends number = number, M extends number = number, L extends number = number, Id = any> {
  help?: ComponentType<LocationHelpProps<P, L>>
  height?: number
  width?: number
  ratio?: number
  rotationUnit = 'deg'

  location?: Location<P, L>
  locations: Location<P, L>[] = []

  getLocations(_context: MaterialContext<P, M, L>): Location<P, L>[] {
    return this.location ? [this.location] : this.locations
  }

  getSize(_location: Location<P, L>, _context: MaterialContext<P, M, L>): ComponentSize {
    if (this.width && this.height) return { width: this.width, height: this.height }
    if (this.ratio && this.width) return { width: this.width, height: this.width / this.ratio }
    if (this.ratio && this.height) return { width: this.height * this.ratio, height: this.height }
    throw new Error('You must implement 2 of "width", "height" & "ratio" in any Location description')
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

  borderRadius?: number

  getBorderRadius(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number | undefined {
    return this.borderRadius
  }

  extraCss?: Interpolation<Theme>

  getExtraCss(_location: Location<P, L>, _context: LocationContext<P, M, L>): Interpolation<Theme> {
    return this.extraCss
  }

  transformLocation(location: Location<P, L>, context: LocationContext<P, M, L>): string[] {
    return ['translate(-50%, -50%)'].concat(this.transformOwnLocation(location, context))
  }

  transformOwnLocation(location: Location<P, L>, context: LocationContext<P, M, L>): string[] {
    const transform: string[] = []
    const coordinates = this.getCoordinates(location, context)
    if (coordinates) {
      transform.push(`translate3d(${coordinates.x}em, ${coordinates.y}em, ${coordinates.z}em)`)
    }
    const rotateZ = this.getRotateZ(location, context)
    if (rotateZ) {
      transform.push(`rotateZ(${rotateZ}${this.rotationUnit})`)
    }
    return transform
  }

  coordinates?: Coordinates

  getCoordinates(_location: Location<P, L>, _context: LocationContext<P, M, L>): Coordinates | undefined {
    return this.coordinates
  }

  rotateZ: number = 0

  getRotateZ(_location: Location<P, L>, _context: LocationContext<P, M, L>): number {
    return this.rotateZ
  }

  alwaysVisible?: boolean

  isAlwaysVisible(location: Location<P, L>, context: MaterialContext<P, M, L>): boolean {
    if (this.alwaysVisible !== undefined) return this.alwaysVisible
    return context.locators[location.type]?.parentItemType !== undefined
  }

  content?: ComponentType<{location: Location}>

  canDrop(move: MaterialMove<P, M, L>, location: Location<P, L>, context: ItemContext<P, M, L>): boolean {
    return this.isMoveToLocation(move, location, context)
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
      isDeleteItem(move) && equal(location, context.material[move.itemType]?.getStockLocation(
        context.rules.material(move.itemType).getItem(move.itemIndex)!, context)
      )
    )
  }

  displayInParentItemHelp?: boolean
}
