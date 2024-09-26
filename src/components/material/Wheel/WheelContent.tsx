/** @jsxImportSource @emotion/react */
import { css, Interpolation, Theme } from '@emotion/react'
import { backgroundCss, borderRadiusCss, shadowCss, shadowEffect, shineEffect, sizeCss } from '../../../css'
import { FC } from 'react'
import { MaterialContentProps } from '../MaterialDescription'
import { ComponentSize } from '../ComponentDescription'

export type WheelContentProps = {
  size: ComponentSize
  image?: string
  wheelImage?: string
  borderRadius?: number
  extraCss?: Interpolation<Theme>
  wheelExtraCss?: Interpolation<Theme>
} & MaterialContentProps

export const WheelContent: FC<WheelContentProps> = (props) => {
  const { playDown, highlight, size, image, wheelImage, borderRadius, extraCss, wheelExtraCss, children } = props
  return <>
    <div css={[
      faceCss,
      extraCss,
      sizeCss(size.width, size.height),
      wheelImage && [backgroundCss(wheelImage), shadowCss(wheelImage)],
      borderRadius && borderRadiusCss(borderRadius),
      highlight ? shineEffect : (playDown && playDownCss(image))
    ]}>
      {children}
    </div>
    {image && <div css={[
      faceCss,
      wheelExtraCss,
      sizeCss(size.width, size.height),
      backgroundCss(image),
      borderRadius && borderRadiusCss(borderRadius),
      highlight ? shineEffect : (playDown && playDownCss(image))
    ]}/>}
  </>
}

const faceCss = css`
  position: absolute;
  transform-style: preserve-3d;
  backface-visibility: hidden;
`

const playDownCss = (image?: string) => {
  if (image?.endsWith('.jpg')) {
    return shadowEffect
  } else {
    return css`
      filter: brightness(0.5);
    `
  }
}