/**
 * Comes from https://github.com/prc5/react-zoom-pan-pinch/blob/master/src/core/zoom/zoom.utils.ts
 */
export function checkZoomBounds(
  zoom: number,
  minScale: number,
  maxScale: number,
  zoomPadding: number,
  enablePadding: boolean
): number {
  const scalePadding = enablePadding ? zoomPadding : 0
  const minScaleWithPadding = minScale - scalePadding

  if (!Number.isNaN(maxScale) && zoom >= maxScale) return maxScale
  if (!Number.isNaN(minScale) && zoom <= minScaleWithPadding)
    return minScaleWithPadding
  return zoom
}