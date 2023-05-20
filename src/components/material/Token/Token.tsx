/** @jsxImportSource @emotion/react */
import { FC, HTMLAttributes } from 'react'
import { backgroundCss, borderRadiusCss, ComponentSize, shadowCss, sizeCss } from '../../../css'
import { MaterialComponentType } from '../MaterialComponentType'
import { CommonMaterialDescription } from '../MaterialDescription'
import { ItemCustomization } from '../Items'

export type TokenProps = {
  image: string
  borderRadius?: number
} & ComponentSize

export const Token: FC<TokenProps & HTMLAttributes<HTMLDivElement>> = ({ image, height, ratio, borderRadius, ...props }) => (
  <div css={[shadowCss(image), sizeCss({ height, ratio }), backgroundCss(image), borderRadius && borderRadiusCss(borderRadius)]} {...props}>

  </div>
)

export type TokenMaterialDescription<ItemId extends number = number, P extends number = number, M extends number = number, L extends number = number>
  = CommonMaterialDescription<P, M, L> & {
  type: typeof MaterialComponentType.Token
  props: ItemCustomization<TokenProps, ItemId>
}
