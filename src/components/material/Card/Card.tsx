/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { FC, forwardRef, HTMLAttributes } from 'react'
import { borderRadiusCss, ComponentSize, sizeCss } from '../../../css'
import { MaterialComponentType } from '../MaterialComponentType'
import { ItemCustomization } from '../Items'
import { CommonMaterialDescription } from '../MaterialDescription'

export type CardProps = {
  front: CardFaceProps
  back?: CardFaceProps
  borderRadius?: number
} & ComponentSize

export const Card = forwardRef<HTMLDivElement, CardProps & HTMLAttributes<HTMLDivElement>>(
  ({ height, ratio, front, back, borderRadius = height / 15, ...props }, ref) =>
    <div ref={ref} css={[cardCss, sizeCss({ height, ratio }), borderRadiusCss(borderRadius)]} {...props}>
      <CardFace {...front}/>
      {back && <CardFace {...back} css={flip}/>}
    </div>
)

export type CardFaceProps = {
  image?: string
}

export const CardFace: FC<CardFaceProps & HTMLAttributes<HTMLDivElement>> = ({ image, ...props }) => (
  <div css={[cardFaceCss, image && backgroundImage(image)]} {...props}>

  </div>
)

const cardCss = css`
  transform-style: preserve-3d;
`

const cardFaceCss = css`
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: inherit;
  box-shadow: 0 0 0.1em black;
`

const flip = css`
  transform: rotateY(-180deg);
`

const backgroundImage = (image: string) => css`
  background-image: url(${image});
  background-size: cover;
`

export type CardMaterialDescription<ItemId extends number = number, P extends number = number, M extends number = number, L extends number = number>
  = CommonMaterialDescription<P, M, L> & {
  type: typeof MaterialComponentType.Card
  props: ItemCustomization<CardProps, ItemId>,
}
