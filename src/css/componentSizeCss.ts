import { css } from '@emotion/react'

export const sizeCss = (width: number, height: number) => css`
  width: ${(width)}em;
  height: ${(height)}em;
`

export const borderRadiusCss = (radius: number) => css`
  border-radius: ${radius}em;
`

export const shadowCss = (image: string) => image?.endsWith('.jpg') ? css`
  box-shadow: 0 0 0.1em black, 0 0 0.1em black;
` : css`
`

export const fontSizeCss = (size: number) => css`
  font-size: ${size}em;
`

export const perspectiveCss = (perspective: number) => css`
  perspective: ${perspective}em;
`
