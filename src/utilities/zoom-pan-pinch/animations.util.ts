/**
 * Comes from https://github.com/BetterTyped/react-zoom-pan-pinch/blob/master/src/core/animations/animations.utils.ts
 * (mirrors v4.0.4 — re-check on every major upgrade, nothing here fails to compile when it diverges)
 *
 * Only the cancellation half is copied: the animation runner itself is reachable through the public
 * `setTransform` handler. Cancelling is not, and it is still needed because `setTransform` skips the
 * cancellation when it is asked for an instant (animationTime === 0) transform.
 */
import { AnimationType, ReactZoomPanPinchContext } from 'react-zoom-pan-pinch'

const handleCancelAnimationFrame = (animation: AnimationType | null) => {
  if (typeof animation === 'number') {
    cancelAnimationFrame(animation)
  }
}

export const handleCancelAnimation = (
  contextInstance: ReactZoomPanPinchContext
): void => {
  if (!contextInstance.mounted) return
  handleCancelAnimationFrame(contextInstance.animation)
  // Clear animation state
  contextInstance.isAnimating = false
  contextInstance.animation = null
  contextInstance.velocity = null
}
