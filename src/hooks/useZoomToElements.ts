import { ReactZoomPanPinchContext, ReactZoomPanPinchHandlers, ReactZoomPanPinchState, useControls } from 'react-zoom-pan-pinch'
import { Margin } from '../components'
import { calculateBounds, getMouseBoundedPosition, handleCancelAnimation } from '../utilities/zoom-pan-pinch'

type SetTransform = ReactZoomPanPinchHandlers['setTransform']

// react-zoom-pan-pinch declares its easing names inline on the handler signatures without exporting the
// `animations` record they come from, so the union has to be derived from the public signature.
type AnimationName = NonNullable<Parameters<SetTransform>[4]>

const MIN_SAFE_SCALE = 1e-7

/**
 * Equivalent of the library's own checkZoomBounds, reduced to the zero-padding case we call it with.
 */
const clampScale = (scale: number, minScale: number, maxScale: number) =>
  Math.min(Math.max(scale, Math.max(minScale, MIN_SAFE_SCALE)), maxScale)

/**
 * react-zoom-pan-pinch only has "zoomToElement". This code is the equivalent to zoom to display multiple elements at once.
 */
export function useZoomToElements(): (elements: HTMLElement[], options?: ZoomToElementsOptions) => void {
  const { instance, setTransform } = useControls()
  return zoomToElements(instance, setTransform)
}

type ZoomToElementsOptions = { scale?: number, animationTime?: number, animationType?: AnimationName, margin?: Margin }

const zoomToElements = (contextInstance: ReactZoomPanPinchContext, setTransform: SetTransform) => (
  nodes: (HTMLElement | string)[],
  options: ZoomToElementsOptions = {}
): void => {
  const { wrapperComponent } = contextInstance
  const { scale, animationTime = 600, animationType = 'easeOut', margin } = options

  const targets: HTMLElement[] = nodes
    .map(node => typeof node === 'string' ? document.getElementById(node)! : node)
    // A focused node may have been detached from the DOM between registration and now (e.g. a
    // StrictMode mount/unmount/remount cycle, or an item re-rendered to a new node). Such nodes
    // cannot be zoomed to, so ignore them instead of aborting the whole zoom because of one of them.
    .filter(target => target && wrapperComponent?.contains(target))

  if (wrapperComponent && targets.length) {
    // `setTransform` cancels a running animation only when it animates; asked for an instant transform
    // it writes the state directly, and the animation still in flight would overwrite it next frame.
    if (animationTime === 0) handleCancelAnimation(contextInstance)
    const { positionX, positionY, scale: newScale } = calculateZoomToNodes(contextInstance, targets, { customZoom: scale, margin })
    setTransform(positionX, positionY, newScale, animationTime, animationType)
  }
}

function calculateZoomToNodes(
  contextInstance: ReactZoomPanPinchContext,
  nodes: HTMLElement[],
  options: { customZoom?: number, margin?: Margin } = {}
): { positionX: number; positionY: number; scale: number } {
  const { wrapperComponent, contentComponent, state: transformState } =
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

  const newScale = clampScale(customZoom || Math.min(scaleX, scaleY), minScale, maxScale)

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
