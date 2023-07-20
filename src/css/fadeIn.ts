import { css, keyframes } from '@emotion/react'

export const fadeIn = (duration: number) => css`
  animation: ${fadeInKeyFrames} ${duration}s ease-in-out forwards
`

const fadeInKeyFrames = keyframes`
  from {
    opacity: 0;
  }
`
