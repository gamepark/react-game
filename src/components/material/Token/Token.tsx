/** @jsxImportSource @emotion/react */
import { forwardRef, HTMLAttributes } from 'react'
import { backgroundCss, borderRadiusCss, ComponentSize, shadowCss, sizeCss } from '../../../css'
import { MaterialComponentType } from '../MaterialComponentType'
import { CommonMaterialDescription } from '../MaterialDescription'
import { ItemCustomization } from '../Items'

export type TokenProps = {
  image: string
  borderRadius?: number
} & ComponentSize

export const Token = forwardRef<HTMLDivElement, TokenProps & HTMLAttributes<HTMLDivElement>>(
  ({ image, height, ratio, borderRadius, ...props }, ref) =>
    <div ref={ref} css={[shadowCss(image), sizeCss({ height, ratio }), backgroundCss(image), borderRadius && borderRadiusCss(borderRadius)]} {...props}/>
)

export abstract class TokenMaterialDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any> extends CommonMaterialDescription<P, M, L> {
  type: typeof MaterialComponentType.Token = MaterialComponentType.Token
  abstract props: ItemCustomization<TokenProps, ItemId>
}
