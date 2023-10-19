import {css} from '@emotion/react'

export const backgroundCss = (image?: string) => image && css`
  background-image: url(${image});
  background-size: cover;
`