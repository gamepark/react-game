import { css, Interpolation, keyframes, Theme } from '@emotion/react'
import { Animation } from '@gamepark/react-client'
import { isMoveItemType, MoveItem } from '@gamepark/rules-api'
import { FC } from 'react'
import { backgroundCss, borderRadiusCss, shineEffect, sizeCss, transparencyShadowEffect } from '../../../css'
import { useAnimation, useMaterialContext } from '../../../hooks'
import { ComponentSize } from '../ComponentDescription'
import { MaterialContentProps } from '../MaterialDescription'


export type WheelItemProps = {
  size: ComponentSize
  image?: string
  wheelImage?: string
  borderRadius?: number
  extraCss?: Interpolation<Theme>
  wheelExtraCss?: Interpolation<Theme>
  angles: number[]
} & MaterialContentProps

export const WheelItem: FC<WheelItemProps> = (props) => {
  const { itemIndex, type, angles, playDown, highlight, size, image, wheelImage, borderRadius, extraCss, wheelExtraCss } = props
  const context = useMaterialContext()
  const animation = useAnimation<MoveItem>(({ move }) => !!type && isMoveItemType(type)(move) && move.itemIndex === itemIndex)
  const item = itemIndex !== undefined? context.rules.material(type!).getItem(itemIndex): undefined

  return <>
    <div css={[
      wheelExtraCss,
      sizeCss(size.width, size.height),
      wheelImage && [backgroundCss(wheelImage)],
      borderRadius && borderRadiusCss(borderRadius),
      highlight ? shineEffect : (playDown && transparencyShadowEffect),
      wheelRotationCss(item?.location.rotation ?? 0, angles),
      !!animation && !!item && animateWheelCss(animation, angles)
    ]}>
    </div>
    {image && <div css={[
      coverCss,
      extraCss,
      sizeCss(size.width, size.height),
      backgroundCss(image),
      borderRadius && borderRadiusCss(borderRadius),
      highlight ? shineEffect : (playDown && transparencyShadowEffect)
    ]}/>}
  </>
}

const wheelRotationCss = (rotation: number, angles: number[]) => css`
  transform: rotateZ(${angles[rotation ?? 0]}deg); 
`

const whellRotationAnimation = (animation: Animation<MoveItem>, angles: number[]) => keyframes`
  to {
    ${wheelRotationCss(animation.move.location.rotation, angles)}
  }
`

const animateWheelCss = (animation: Animation, angles: number[]) => css`
  animation: ${whellRotationAnimation(animation, angles)} ${animation.duration}s ease-in-out forwards;
`

const coverCss = css`
  position: absolute;
  top: 0;
  left: 0;
`
