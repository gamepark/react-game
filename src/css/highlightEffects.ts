import { css, keyframes } from '@emotion/react'

/**
 * Effects to draw the eye to an item that can be moved, to combine with the shine (see FlatMaterialDescription.getHighlightCss).
 *
 * The motions use the individual "translate" and "scale" properties rather than "transform": they compose with the
 * transform the element already has (the face of an item has one), instead of replacing it.
 * Whoever asked the system for reduced motion keeps the item still.
 */

const floatKeyframes = keyframes`
  0%, 100% {
    translate: 0 0;
  }
  50% {
    translate: 0 var(--float-height);
  }
`

/**
 * The item rises and falls slowly, as if it was floating.
 * @param height How far the item rises, as a CSS length (negative goes up the screen)
 * @param duration Duration of one rise and fall, in seconds
 */
export const floatEffect = (height = '-0.3em', duration = 2) => css`
  --float-height: ${height};
  @media (prefers-reduced-motion: no-preference) {
    animation: ${floatKeyframes} ${duration}s ease-in-out infinite;
  }
`

const breatheKeyframes = keyframes`
  0%, 100% {
    scale: 1;
  }
  50% {
    scale: var(--breathe-scale);
  }
`

/**
 * The item grows and shrinks a little, like a breath.
 * @param scale The largest scale of the item
 * @param duration Duration of one breath, in seconds
 */
export const breatheEffect = (scale = 1.04, duration = 2) => css`
  --breathe-scale: ${scale};
  @media (prefers-reduced-motion: no-preference) {
    animation: ${breatheKeyframes} ${duration}s ease-in-out infinite;
  }
`

const glowKeyframes = keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 0.1em var(--glow-color));
  }
  50% {
    filter: drop-shadow(0 0 var(--glow-size) var(--glow-color));
  }
`

/**
 * A halo that pulses around the item. A drop-shadow follows the alpha channel of the image, so it hugs the outline
 * of an item with transparency.
 * A filter is repainted on each frame and flattens the 3D rendering of the element: keep it for a few items at a time.
 * It does not combine with {@link floatEffect} or {@link breatheEffect} on the same element, as each one has its own
 * animation: use {@link glowFloatEffect} for both.
 * @param color Color of the halo
 * @param size Largest blur of the halo, as a CSS length
 * @param duration Duration of one pulse, in seconds
 */
export const glowEffect = (color = 'gold', size = '0.4em', duration = 2) => css`
  --glow-color: ${color};
  --glow-size: ${size};
  filter: drop-shadow(0 0 0.1em var(--glow-color));
  @media (prefers-reduced-motion: no-preference) {
    animation: ${glowKeyframes} ${duration}s ease-in-out infinite;
  }
`

/**
 * {@link glowEffect} and {@link floatEffect} together, on a single animation.
 */
export const glowFloatEffect = (color = 'gold', size = '0.4em', height = '-0.3em', duration = 2) => css`
  --glow-color: ${color};
  --glow-size: ${size};
  --float-height: ${height};
  filter: drop-shadow(0 0 0.1em var(--glow-color));
  @media (prefers-reduced-motion: no-preference) {
    animation: ${glowKeyframes} ${duration}s ease-in-out infinite, ${floatKeyframes} ${duration}s ease-in-out infinite;
  }
`
