import { css } from '@emotion/react'

export const transformCss = (...transformations: (string | false | undefined)[]) => css`
  transform: ${transformations.filter(t => !!t).join(' ')};
`

export const preserve3d = css`
  transform-style: preserve-3d;
`
