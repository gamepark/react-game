import { FC } from 'react'
import { ItemContext, LocationRulesProps, MaterialContext } from '../../../locators'
import { ComponentSize } from '../MaterialDescription'
import { Coordinates, isDeleteItem, isMoveItem, Location, MaterialMove } from '@gamepark/rules-api'
import { Interpolation, Theme } from '@emotion/react'
import { isLocationSubset } from '../utils'
import equal from 'fast-deep-equal'

export abstract class LocationDescription<P extends number = number, M extends number = number, L extends number = number, Id = any> {
  rules?: FC<LocationRulesProps<P, L>>
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

  rulesImage?: string

  getRulesImage(location: Location<P, L>, context: MaterialContext<P, M, L>): string | undefined {
    return this.rulesImage ?? this.getImage(location, context)
  }

  borderRadius?: number

  getBorderRadius(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number | undefined {
    return this.borderRadius
  }

  extraCss?: Interpolation<Theme>

  getExtraCss(_location: Location<P, L>, _context: MaterialContext<P, M, L>): Interpolation<Theme> {
    return this.extraCss
  }

  coordinates?: Coordinates

  getCoordinates(_location: Location<P, L>, _context: MaterialContext<P, M, L>): Coordinates | undefined {
    return this.coordinates
  }

  getRotation?(location: Location<P, L>, context: MaterialContext<P, M, L>): number

  alwaysVisible?: boolean

  isAlwaysVisible(location: Location<P, L>, context: MaterialContext<P, M, L>): boolean {
    if (this.alwaysVisible !== undefined) return this.alwaysVisible
    return context.locators[location.type].parentItemType !== undefined
  }

  canDrop(move: MaterialMove<P, M, L>, location: Location<P, L>, context: ItemContext<P, M, L>): boolean {
    return this.isMoveToLocation(move, location, context)
  }

  canLongClick(move: MaterialMove<P, M, L>, location: Location<P, L>, context: MaterialContext<P, M, L>): boolean {
    return this.isMoveToLocation(move, location, context)
  }

  protected isMoveToLocation(move: MaterialMove<P, M, L>, location: Location<P, L>, context: MaterialContext<P, M, L>) {
    return (isMoveItem(move) && move.position.location !== undefined && isLocationSubset(move.position.location, location))
      || (isDeleteItem(move) && equal(location, context.material[move.itemType].getStockLocation(
        context.rules.material(move.itemType).getItem(move.itemIndex)!, context)
      ))
  }
}
