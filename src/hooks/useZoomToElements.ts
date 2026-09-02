import { ReactZoomPanPinchContext, useControls, ZoomToElementOptions, ZoomToElementTarget } from 'react-zoom-pan-pinch'
import { Margin } from '../components'

type ZoomToElementsOptions = {
  scale?: number
  animationTime?: number
  animationType?: NonNullable<ZoomToElementOptions['animationType']>
  /** Free space to keep around the elements, in em of the table font size */
  margin?: Margin
}

/**
 * Zoom to display several elements at once.
 *
 * The library's own "zoomToElement" takes an array of targets since v4.1.0 (issue #388), so all that is left
 * here is the "margin" option: the library only offers pixel offsets, which move the view without making any
 * room, and our margins are expressed in em of the table font size.
 */
export function useZoomToElements(): (elements: ZoomToElementTarget[], options?: ZoomToElementsOptions) => Promise<void> {
  const { instance, zoomToElement } = useControls()
  return (elements: ZoomToElementTarget[], options: ZoomToElementsOptions = {}) => {
    const { margin, ...zoomOptions } = options
    return zoomToElement(elements, { ...zoomOptions, ...fitMargin(instance, elements, margin, options.scale) })
  }
}

/**
 * "zoomToElement" fits the elements themselves in the viewport. To keep a margin free around them, we fit the
 * expanded rectangle ourselves and pass the result as an explicit zoom, then shift the view by half of the
 * left/right (resp. top/bottom) difference so that the expanded rectangle, and not the elements, ends centered.
 */
function fitMargin(
  instance: ReactZoomPanPinchContext, elements: ZoomToElementTarget[], margin?: Margin, customScale?: number
): ZoomToElementOptions {
  const { wrapperComponent, contentComponent, state, setup } = instance
  if (!margin || !wrapperComponent || !contentComponent) return {}
  const rects = elements
    .map(element => typeof element === 'string' ? document.getElementById(element) : element)
    // A focused node may have been detached from the DOM between registration and now (e.g. a StrictMode
    // mount/unmount/remount cycle, or an item re-rendered to a new node): "zoomToElement" ignores those too.
    .filter((element): element is HTMLElement => !!element && wrapperComponent.contains(element))
    .map(element => element.getBoundingClientRect())
  if (!rects.length) return {}

  // Everything below is in unscaled content pixels, the unit the library computes its own fit in.
  const fontSize = parseFloat(window.getComputedStyle(contentComponent.firstElementChild!).fontSize)
  const { top = 0, right = 0, bottom = 0, left = 0 } = margin
  const width = (Math.max(...rects.map(rect => rect.right)) - Math.min(...rects.map(rect => rect.left))) / state.scale + (left + right) * fontSize
  const height = (Math.max(...rects.map(rect => rect.bottom)) - Math.min(...rects.map(rect => rect.top))) / state.scale + (top + bottom) * fontSize
  const fitScale = customScale || Math.min(wrapperComponent.offsetWidth / width, wrapperComponent.offsetHeight / height)
  // The library clamps the scale we give it: clamp it here too, as the offsets below depend on the final scale.
  const scale = Math.min(Math.max(fitScale, setup.minScale), setup.maxScale)

  return { scale, offsetX: (left - right) * fontSize * scale / 2, offsetY: (top - bottom) * fontSize * scale / 2 }
}
