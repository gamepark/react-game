import { FC } from 'react'
import { LocationRulesProps, MaterialContext } from '../../../locators'
import { ComponentSize } from '../MaterialDescription'
import { Coordinates, Location } from '@gamepark/rules-api'
import { Interpolation, Theme } from '@emotion/react'

export abstract class LocationDescription<P extends number = number, M extends number = number, L extends number = number> {
  rules?: FC<LocationRulesProps<P, L>>
  height?: number
  width?: number
  ratio?: number
  rotationUnit = 'deg'

  getSize(_location: Location<P, L>, _context: MaterialContext<P, M, L>): ComponentSize {
    if (this.width && this.height) return { width: this.width, height: this.height }
    if (this.ratio && this.width) return { width: this.width, height: this.width / this.ratio }
    if (this.ratio && this.height) return { width: this.height * this.ratio, height: this.height }
    throw new Error('You must implement 2 of "width", "height" & "ratio" in any Location description')
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
}
