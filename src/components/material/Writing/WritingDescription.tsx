import { css } from '@emotion/react'
import { ReactNode } from 'react'
import { borderRadiusCss, shineEffect, sizeCss, transparencyShadowEffect } from '../../../css'
import { MaterialContentProps, MaterialDescription } from '../MaterialDescription'

export abstract class WritingDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends MaterialDescription<P, M, L, ItemId> {

  getFrontContent(_itemId: ItemId): ReactNode | undefined {
    return
  }

  content = ({ itemId, highlight, playDown }: MaterialContentProps<ItemId>) => {
    const size = this.getSize(itemId)
    const borderRadius = this.getBorderRadius(itemId)
    return <div css={[
      faceCss,
      sizeCss(size.width, size.height),
      borderRadius && borderRadiusCss(borderRadius),
      highlight ? shineEffect : playDown && transparencyShadowEffect
    ]}>
      {this.getFrontContent(itemId)}
    </div>
  }
}

export const isWritingDescription = <P extends number = number, M extends number = number, L extends number = number, ItemId = any>(description: MaterialDescription<P, M, L, ItemId>): description is WritingDescription<P, M, L, ItemId> => {
  return typeof (description as WritingDescription<P, M, L, ItemId>).getFrontContent === 'function'
}

const faceCss = css`
  position: absolute;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`
