import { css } from '@emotion/react'

export const shadowEffect = css`
  &:after {
    content: '';
    position: absolute;
    pointer-events: none;
    border-radius: inherit;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 1;
    background: rgba(0, 0, 0, 0.5);
  }
`

export const transparencyShadowEffect = css`
  filter: brightness(0.5);
`

export const playDownCss = (transparency: boolean) => transparency ? transparencyShadowEffect : shadowEffect
