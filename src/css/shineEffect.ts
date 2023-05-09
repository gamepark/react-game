import { css, keyframes } from '@emotion/react'

const slideKeyframes = keyframes`
  0% {
    transform: translate(-33%, -33%);
  }
  50%, 100% {
    transform: translate(33%, 33%);
  }
`

export const shineEffect = css`
  overflow: hidden;

  &:after {
    content: '';
    position: absolute;
    pointer-events: none;
    left: -100%;
    right: -100%;
    top: -100%;
    bottom: -100%;
    animation: ${slideKeyframes} 2s linear infinite;
    z-index: 1;
    transform-style: preserve-3d;
    background: linear-gradient(to bottom right,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0) 34%,
    rgba(255, 255, 255, 0.7) 50%,
    rgba(255, 255, 255, 0) 66%,
    rgba(255, 255, 255, 0) 100%);
  }
`
