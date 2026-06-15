import { css, keyframes } from '@emotion/react'

// The fade must be applied on the inner element (> *), like every other item animation, and not on the
// outer wrapper: the wrapper carries the preserve-3d context that places the item in the scene. Setting
// opacity < 1 on it would force the 3D context to flatten, snapping the item out of the perspective.
export const fadeIn = (duration: number) => css`
  > * {
    animation: ${fadeInKeyFrames} ${duration}s ease-in-out forwards;
  }
`

const fadeInKeyFrames = keyframes`
  from {
    opacity: 0;
  }
`
