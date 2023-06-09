import { ReactZoomPanPinchContext, ReactZoomPanPinchState, useTransformContext } from 'react-zoom-pan-pinch'
import { animations } from '../utilities/animations.constants'
import { calculateBounds, getMouseBoundedPosition } from '../utilities/bounds.util'
import { checkZoomBounds } from '../utilities/zoom.util'
import { animate, handleCancelAnimation } from '../utilities/animations.util'

/**
 * react-zoom-pan-pinch only has "zoomToElement". This code is the equivalent to zoom to display multiple elements at once.
 */
export function useZoomToElements(): (elements: HTMLElement[], scale?: number, animationTime?: number, animationType?: keyof typeof animations) => void {
  const libraryContext = useTransformContext()
  return zoomToElements(libraryContext)
}

const zoomToElements = (contextInstance: ReactZoomPanPinchContext) => (
  nodes: (HTMLElement | string)[],
  scale?: number,
  animationTime = 600,
  animationType: keyof typeof animations = 'easeOut'
): void => {
  handleCancelAnimation(contextInstance)

  const { wrapperComponent } = contextInstance

  const targets: HTMLElement[] = nodes.map(node =>
    typeof node === 'string' ? document.getElementById(node)! : node
  )

  if (wrapperComponent && targets.length && targets.every(target => wrapperComponent.contains(target))) {
    const targetState = calculateZoomToNodes(contextInstance, targets, scale)
    animate(contextInstance, targetState, animationTime, animationType)
  }
}

function calculateZoomToNodes(
  contextInstance: ReactZoomPanPinchContext,
  nodes: HTMLElement[],
  customZoom?: number
): { positionX: number; positionY: number; scale: number } {
  const { wrapperComponent, contentComponent, transformState } =
    contextInstance
  const { limitToBounds, minScale, maxScale } = contextInstance.setup
  if (!wrapperComponent || !contentComponent) return transformState

  const wrapperRect = wrapperComponent.getBoundingClientRect()
  const nodesRect = nodes.map(node => node.getBoundingClientRect())
  const nodesWidth = Math.max(...nodesRect.map(rect => rect.x + rect.width)) - Math.min(...nodesRect.map(rect => rect.x))
  const nodesHeight = Math.max(...nodesRect.map(rect => rect.y + rect.height)) - Math.min(...nodesRect.map(rect => rect.y))
  const nodesOffset = nodes.map(node => getOffset(node, wrapperComponent, contentComponent, transformState))

  const nodeLeft = Math.min(...nodesOffset.map(offset => offset.x))
  const nodeTop = Math.min(...nodesOffset.map(offset => offset.y))
  const nodeWidth = nodesWidth / transformState.scale
  const nodeHeight = nodesHeight / transformState.scale

  const scaleX = wrapperComponent.offsetWidth / nodeWidth
  const scaleY = wrapperComponent.offsetHeight / nodeHeight

  const newScale = checkZoomBounds(
    customZoom || Math.min(scaleX, scaleY),
    minScale,
    maxScale,
    0,
    false
  )

  const offsetX = (wrapperRect.width - nodeWidth * newScale) / 2
  const offsetY = (wrapperRect.height - nodeHeight * newScale) / 2

  const newPositionX = (wrapperRect.left - nodeLeft) * newScale + offsetX
  const newPositionY = (wrapperRect.top - nodeTop) * newScale + offsetY

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
