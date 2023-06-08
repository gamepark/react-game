import { css } from '@emotion/react'

export const transformCss = (...transformations: (string | false | undefined)[]) => css`
  transform: ${transformations.filter(t => !!t).join(' ')};
`
