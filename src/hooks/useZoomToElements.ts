import { ReactZoomPanPinchContext, ReactZoomPanPinchState, useTransformContext } from 'react-zoom-pan-pinch'
import { Margin } from '../components'
import { animations } from '../utilities/zoom-pan-pinch'
import { animate, handleCancelAnimation } from '../utilities/zoom-pan-pinch'
import { calculateBounds, getMouseBoundedPosition } from '../utilities/zoom-pan-pinch'
import { checkZoomBounds } from '../utilities/zoom-pan-pinch'

/**
 * react-zoom-pan-pinch only has "zoomToElement". This code is the equivalent to zoom to display multiple elements at once.
 */
export function useZoomToElements(): (elements: HTMLElement[], options?: ZoomToElementsOptions) => void {
  const libraryContext = useTransformContext()
  return zoomToElements(libraryContext)
}

type ZoomToElementsOptions = { scale?: number, animationTime?: number, animationType?: keyof typeof animations, margin?: Margin }

const zoomToElements = (contextInstance: ReactZoomPanPinchContext) => (
  nodes: (HTMLElement | string)[],
  options: ZoomToElementsOptions = {}
): void => {
  handleCancelAnimation(contextInstance)

  const { wrapperComponent } = contextInstance
  const { scale, animationTime = 600, animationType = 'easeOut', margin } = options

  const targets: HTMLElement[] = nodes.map(node =>
    typeof node === 'string' ? document.getElementById(node)! : node
  )

  if (wrapperComponent && targets.length && targets.every(target => wrapperComponent.contains(target))) {
    const targetState = calculateZoomToNodes(contextInstance, targets, { customZoom: scale, margin })
    animate(contextInstance, targetState, animationTime, animationType)
  }
}

function calculateZoomToNodes(
  contextInstance: ReactZoomPanPinchContext,
  nodes: HTMLElement[],
  options: { customZoom?: number, margin?: Margin } = {}
): { positionX: number; positionY: number; scale: number } {
  const { wrapperComponent, contentComponent, transformState } =
    contextInstance
  const { limitToBounds, minScale, maxScale } = contextInstance.setup
  if (!wrapperComponent || !contentComponent) return transformState

  const { customZoom, margin: { bottom = 0, left = 0, right = 0, top = 0 } = {} } = options
  const wrapperRect = wrapperComponent.getBoundingClientRect()
  const fontSize = parseFloat(window.getComputedStyle(contentComponent.firstElementChild!, null).getPropertyValue('font-size'))
  const nodesRect = nodes.map(node => node.getBoundingClientRect())
  const nodesWidth = Math.max(...nodesRect.map(rect => rect.x + rect.width)) - Math.min(...nodesRect.map(rect => rect.x))
  const nodesHeight = Math.max(...nodesRect.map(rect => rect.y + rect.height)) - Math.min(...nodesRect.map(rect => rect.y))
  const nodesOffset = nodes.map(node => getOffset(node, wrapperComponent, contentComponent, transformState))

  const focusLeft = Math.min(...nodesOffset.map(offset => offset.x)) - left * fontSize
  const focusTop = Math.min(...nodesOffset.map(offset => offset.y)) - top * fontSize
  const focusWidth = nodesWidth / transformState.scale + (left + right) * fontSize
  const focusHeight = nodesHeight / transformState.scale + (top + bottom) * fontSize

  const scaleX = wrapperComponent.offsetWidth / focusWidth
  const scaleY = wrapperComponent.offsetHeight / focusHeight

  const newScale = checkZoomBounds(
    customZoom || Math.min(scaleX, scaleY),
    minScale,
    maxScale,
    0,
    false
  )

  const offsetX = (wrapperRect.width - focusWidth * newScale) / 2
  const offsetY = (wrapperRect.height - focusHeight * newScale) / 2

  const newPositionX = (wrapperRect.left - focusLeft) * newScale + offsetX
  const newPositionY = (wrapperRect.top - focusTop) * newScale + offsetY

  const bounds = calculateBounds(contextInstance, newScale)

  const { x, y } = getMouseBoundedPosition(
    newPositionX,
    newPositionY,
    bounds,
    limitToBounds,
    0,
    0,
    wrapperComponent
  )

  return { positionX: x, positionY: y, scale: newScale }
}

function getOffset(
  element: HTMLElement,
  wrapper: HTMLElement,
  content: HTMLElement,
  state: ReactZoomPanPinchState
) {
  const offset = element.getBoundingClientRect()
  const wrapperOffset = wrapper.getBoundingClientRect()
  const contentOffset = content.getBoundingClientRect()

  const xOff = wrapperOffset.x * state.scale
  const yOff = wrapperOffset.y * state.scale

  return {
    x: (offset.x - contentOffset.x + xOff) / state.scale,
    y: (offset.y - contentOffset.y + yOff) / state.scale
  }
}
