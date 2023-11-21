/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { MaterialItem } from '@gamepark/rules-api'
import { ReactNode } from 'react'
import { backgroundCss, borderRadiusCss, shadowCss, shadowEffect, shineEffect, sizeCss } from '../../../css'
import { ItemContext, MaterialContext } from '../../../locators'
import { MaterialContentProps, MaterialDescription } from '../MaterialDescription'

export abstract class WritingDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends MaterialDescription<P, M, L, ItemId> {

  image?: string
  images?: Record<ItemId extends keyof any ? ItemId : never, string>

  getImage(itemId: ItemId, context: MaterialContext<P, M, L>): string | undefined {
    return this.images?.[this.getFrontId(itemId, context)] ?? this.image
  }

  getImages(): string[] {
    const images: string[] = []
    if (this.image) images.push(this.image)
    if (this.images) images.push(...Object.values(this.images) as string[])
    return images
  }

  protected getFrontId(itemId: ItemId, _context: MaterialContext<P, M, L>) {
    return typeof itemId === 'object' ? (itemId as any).front : itemId as keyof any
  }

  getFrontContent(_itemId: ItemId, _context: MaterialContext<P, M, L>): ReactNode | undefined {
    return
  }

  getRotations(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string[] {
    const rotations: string[] = []
    const rotateZ = this.getRotateZ(item, context)
    if (rotateZ) rotations.push(`rotateZ(${rotateZ}deg)`)
    return rotations
  }

  getRotateZ(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): number {
    return 0
  }

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
