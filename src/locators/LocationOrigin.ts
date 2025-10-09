import { css } from '@emotion/react'
import { GridBoundaries } from '@gamepark/rules-api'

export enum OriginType {
  Origin,
  Center,
  Min,
  Max
}

export type LocationOrigin = {
  x: OriginType,
  y: OriginType
}

export const defaultOrigin = { x: OriginType.Origin, y: OriginType.Origin }

export function getLocationOriginCss(tableBoundaries: GridBoundaries, origin?: LocationOrigin) {
  const { xMin, xMax, yMin, yMax } = tableBoundaries
  return positionCss(getPosition(xMin, xMax, origin?.x), getPosition(yMin, yMax, origin?.y))
}

function getPosition(min: number, max: number, origin = OriginType.Origin) {
  switch (origin) {
    case OriginType.Origin:
      return -min
    case OriginType.Center:
      return (max - min) / 2
    case OriginType.Min:
      return 0
    case OriginType.Max:
      return max - min
  }
}

export function getOriginDeltaPosition(min: number, max: number, before: OriginType, after: OriginType) {
  return getPosition(min, max, after) - getPosition(min, max, before)
}

const positionCss = (left: number, top: number) => css`
  position: absolute;
  left: ${left}em;
  top: ${top}em;
  transform-style: preserve-3d;
`
