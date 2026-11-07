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

/**
 * The gradient is 3 times the size of the item: at 100% 100% the item shows its last third, where the band has not
 * arrived yet, and at 0% 0% its first third, once the band has gone through.
 */
const maskedSlideKeyframes = keyframes`
  0% {
    background-position: 100% 100%;
  }
  50%, 100% {
    background-position: 0 0;
  }
`

/**
 * The same shine as {@link shineEffect}, for an image with transparency: the image itself masks the shine, so that the
 * band only sweeps the opaque part of the item instead of the rectangle around it.
 * The pseudo-element keeps the size of the item and the band moves inside it, otherwise the mask would move with it.
 * Nothing is clipped on the item itself, so its children and a filter on it (see glowEffect) are left alone.
 *
 * @param image The image displayed by the element, sized like its background (cover)
 */
export const maskedShineEffect = (image: string) => css`
  &:after {
    content: '';
    position: absolute;
    pointer-events: none;
    inset: 0;
    z-index: 1;
    border-radius: inherit;
    mask-image: url(${image});
    mask-size: cover;
    mask-repeat: no-repeat;
    -webkit-mask-image: url(${image});
    -webkit-mask-size: cover;
    -webkit-mask-repeat: no-repeat;
    background: linear-gradient(to bottom right,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0) 34%,
    rgba(255, 255, 255, 0.7) 50%,
    rgba(255, 255, 255, 0) 66%,
    rgba(255, 255, 255, 0) 100%);
    background-size: 300% 300%;
    animation: ${maskedSlideKeyframes} 2s linear infinite;
  }
`
