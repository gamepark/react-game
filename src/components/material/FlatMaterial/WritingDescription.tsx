/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { backgroundCss, borderRadiusCss, shadowCss, shadowEffect, shineEffect, sizeCss } from '../../../css'
import { MaterialContentProps } from '../MaterialDescription'
import { FlatMaterialDescription } from './FlatMaterial'

export abstract class WritingDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends FlatMaterialDescription<P, M, L, ItemId> {

  content = ({ itemId, context, highlight, playDown }: MaterialContentProps<P, M, L, ItemId>) => {
    const image = this.getImage(itemId, context)
    const size = this.getSize(itemId, context)
    const borderRadius = this.getBorderRadius(itemId, context)
    return <>
      <div css={[
        faceCss,
        sizeCss(size.width, size.height),
        image && [backgroundCss(image), shadowCss(image)],
        borderRadius && borderRadiusCss(borderRadius),
        highlight ? shineEffect : playDown && playDownCss(image)
      ]}>
        {this.getFrontContent(itemId, context)}
      </div>
    </>
  }
}

const faceCss = css`
  position: absolute;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
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
