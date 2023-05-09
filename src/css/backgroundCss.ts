import {css} from '@emotion/react'

export const backgroundCss = (image: string) => css`
  background-image: url(${image});
  background-size: cover;
`