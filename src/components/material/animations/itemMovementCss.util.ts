import { css, keyframes, Keyframes } from '@emotion/react'

export const movementAnimationCss = (keyframes: Keyframes, duration: number) => css`
  animation: ${upAndDown} ${duration}s linear infinite;

  > * {
    animation: ${keyframes} ${duration}s ease-in-out forwards;
  }
`

const upAndDown = keyframes`
  from, to {
    transform: none;
  }
  50% {
    transform: translateZ(10em);
  }
`

