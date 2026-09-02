/**
 * Comes from https://github.com/BetterTyped/react-zoom-pan-pinch/blob/master/src/core/bounds/bounds.utils.ts
 * (mirrors v4.1.1 — re-check on every major upgrade, nothing here fails to compile when it diverges)
 *
 * The library exports no equivalent, and the window resize handler of the game table needs to clamp a
 * position it computed itself, so this stays copied. v4 changed the `centerZoomedOut` factor and added
 * the `disablePadding` / explicit position handling below.
 */
import { BoundsType, PositionType, ReactZoomPanPinchContext } from 'react-zoom-pan-pinch'
import { roundNumber } from './calculation.util'

export function getComponentsSizes(
  wrapperComponent: HTMLDivElement,
  contentComponent: HTMLDivElement,
  newScale: number
): any {
  const wrapperWidth = wrapperComponent.offsetWidth
  const wrapperHeight = wrapperComponent.offsetHeight

  const contentWidth = contentComponent.offsetWidth
  const contentHeight = contentComponent.offsetHeight

  const newContentWidth = contentWidth * newScale
  const newContentHeight = contentHeight * newScale
  const newDiffWidth = wrapperWidth - newContentWidth
  const newDiffHeight = wrapperHeight - newContentHeight

  return {
    wrapperWidth,
    wrapperHeight,
    newContentWidth,
    newDiffWidth,
    newContentHeight,
    newDiffHeight
  }
}

export const getBounds = (
  wrapperWidth: number,
  newContentWidth: number,
  diffWidth: number,
  wrapperHeight: number,
  newContentHeight: number,
  diffHeight: number,
  centerZoomedOut: boolean
): BoundsType => {
  const scaleWidthFactor =
    wrapperWidth > newContentWidth
      ? diffWidth * (centerZoomedOut ? 0.5 : 1)
      : 0
  const scaleHeightFactor =
    wrapperHeight > newContentHeight
      ? diffHeight * (centerZoomedOut ? 0.5 : 1)
      : 0

  const minPositionX = wrapperWidth - newContentWidth - scaleWidthFactor
  const maxPositionX = scaleWidthFactor
  const minPositionY = wrapperHeight - newContentHeight - scaleHeightFactor
  const maxPositionY = scaleHeightFactor

  return { minPositionX, maxPositionX, minPositionY, maxPositionY, scaleWidthFactor, scaleHeightFactor }
}

export const calculateBounds = (
  contextInstance: ReactZoomPanPinchContext,
  newScale: number
): BoundsType => {
  const { wrapperComponent, contentComponent } = contextInstance
  const { centerZoomedOut, disablePadding } = contextInstance.setup

  if (!wrapperComponent || !contentComponent) {
    throw new Error('Components are not mounted')
  }

  const {
    wrapperWidth,
    wrapperHeight,
    newContentWidth,
    newDiffWidth,
    newContentHeight,
    newDiffHeight
  } = getComponentsSizes(wrapperComponent, contentComponent, newScale)

  const bounds = getBounds(
    wrapperWidth,
    newContentWidth,
    newDiffWidth,
    wrapperHeight,
    newContentHeight,
    newDiffHeight,
    Boolean(centerZoomedOut)
  )

  const contentFitsCompletely = wrapperWidth >= newContentWidth && wrapperHeight >= newContentHeight
  if (disablePadding && contentFitsCompletely && !centerZoomedOut) {
    bounds.minPositionX = 0
    bounds.maxPositionX = 0
    bounds.minPositionY = 0
    bounds.maxPositionY = 0
  }

  const { minPositionX: propMinX, maxPositionX: propMaxX, minPositionY: propMinY, maxPositionY: propMaxY } = contextInstance.setup

  // Explicit position props define content-space boundaries at scale=1.
  // Scale them so the same content region stays reachable at every zoom level.
  if (propMinX != null) {
    bounds.minPositionX = wrapperWidth * (1 - newScale) + propMinX * newScale
  }
  if (propMaxX != null) {
    bounds.maxPositionX = propMaxX * newScale
  }
  if (propMinY != null) {
    bounds.minPositionY = wrapperHeight * (1 - newScale) + propMinY * newScale
  }
  if (propMaxY != null) {
    bounds.maxPositionY = propMaxY * newScale
  }

  return bounds
}

/**
 * Keeps value between given bounds, used for limiting view to given boundaries
 * 1# eg. boundLimiter(2, 0, 3, true) => 2
 * 2# eg. boundLimiter(4, 0, 3, true) => 3
 * 3# eg. boundLimiter(-2, 0, 3, true) => 0
 * 4# eg. boundLimiter(10, 0, 3, false) => 10
 */
export const boundLimiter = (
  value: number,
  minBound: number,
  maxBound: number,
  isActive: boolean
): number => {
  if (!isActive) return roundNumber(value, 2)
  if (value < minBound) return roundNumber(minBound, 2)
  if (value > maxBound) return roundNumber(maxBound, 2)
  return roundNumber(value, 2)
}

export function getMouseBoundedPosition(
  positionX: number,
  positionY: number,
  bounds: BoundsType,
  limitToBounds: boolean,
  paddingValueX: number,
  paddingValueY: number,
  wrapperComponent: HTMLDivElement | null
): PositionType {
  const { minPositionX, minPositionY, maxPositionX, maxPositionY } = bounds

  let paddingX = 0
  let paddingY = 0

  if (wrapperComponent) {
    paddingX = paddingValueX
    paddingY = paddingValueY
  }

  const x = boundLimiter(
    positionX,
    minPositionX - paddingX,
    maxPositionX + paddingX,
    limitToBounds
  )

  const y = boundLimiter(
    positionY,
    minPositionY - paddingY,
    maxPositionY + paddingY,
    limitToBounds
  )
  return { x, y }
}