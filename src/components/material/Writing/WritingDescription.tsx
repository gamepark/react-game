/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { ReactNode } from 'react'
import { backgroundCss, borderRadiusCss, shadowCss, shadowEffect, shineEffect, sizeCss } from '../../../css'
import { MaterialContentProps, MaterialDescription } from '../MaterialDescription'

export abstract class WritingDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends MaterialDescription<P, M, L, ItemId> {

  image?: string
  images?: Record<ItemId extends keyof any ? ItemId : never, string>

  getImage(itemId: ItemId): string | undefined {
    return this.images?.[this.getFrontId(itemId)] ?? this.image
  }

  getImages(): string[] {
    const images: string[] = []
    if (this.image) images.push(this.image)
    if (this.images) images.push(...Object.values(this.images) as string[])
    return images
  }

  protected getFrontId(itemId: ItemId): keyof typeof this.images {
    return (typeof itemId === 'object' ? (itemId as any).front : itemId) as keyof typeof this.images
  }

  getFrontContent(_itemId: ItemId): ReactNode | undefined {
    return
  }

  content = ({ itemId, highlight, playDown }: MaterialContentProps<ItemId>) => {
    const image = this.getImage(itemId)
    const size = this.getSize(itemId)
    const borderRadius = this.getBorderRadius(itemId)
    return <div css={[
      faceCss,
      sizeCss(size.width, size.height),
      image && [backgroundCss(image), shadowCss(image)],
      borderRadius && borderRadiusCss(borderRadius),
      highlight ? shineEffect : playDown && playDownCss(image)
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

const playDownCss = (image?: string) => {
  if (image?.endsWith('.jpg')) {
    return shadowEffect
  } else {
    return css`
      filter: brightness(0.5);
    `
  }
}
