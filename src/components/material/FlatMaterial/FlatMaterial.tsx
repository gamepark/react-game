/** @jsxImportSource @emotion/react */
import { css, Interpolation, Theme } from '@emotion/react'
import { MaterialItem } from '@gamepark/rules-api'
import { backgroundCss, borderRadiusCss, shadowCss, shadowEffect, shineEffect, sizeCss, transformCss } from '../../../css'
import { ItemContext, MaterialContext } from '../../../locators'
import { MaterialContentProps, MaterialDescription } from '../MaterialDescription'

export abstract class FlatMaterialDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends MaterialDescription<P, M, L, ItemId> {

  image?: string
  images?: Record<ItemId extends keyof any ? ItemId : never, string>

  getImage(itemId: ItemId, context: MaterialContext<P, M, L>): string | undefined {
    return this.images?.[this.getFrontId(itemId, context)] ?? this.image
  }

  backImage?: string
  backImages?: Record<ItemId extends keyof any ? ItemId : never, string>

  getBackImage(itemId: ItemId, context: MaterialContext<P, M, L>): string | undefined {
    return this.backImages?.[this.getBackId(itemId, context)] ?? this.backImage
  }

  getImages(): string[] {
    const images: string[] = []
    if (this.image) images.push(this.image)
    if (this.images) images.push(...Object.values(this.images) as string[])
    if (this.backImage) images.push(this.backImage)
    if (this.backImages) images.push(...Object.values(this.backImages) as string[])
    return images
  }

  protected getFrontId(itemId: ItemId, _context: MaterialContext<P, M, L>) {
    return typeof itemId === 'object' ? (itemId as any).front : itemId as keyof any
  }

  protected getBackId(itemId: ItemId, _context: MaterialContext<P, M, L>) {
    return typeof itemId === 'object' ? (itemId as any).back : itemId as keyof any
  }

  protected hasBackFace() {
    return !!this.backImage || !!this.backImages
  }

  isFlipped(item: Partial<MaterialItem<P, L>>, context: MaterialContext<P, M, L>): boolean {
    return this.hasBackFace() && this.getFrontId(item.id, context) === undefined
  }

  getRotations(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string[] {
    const rotations: string[] = []
    const rotateZ = this.getRotateZ(item, context)
    if (rotateZ) rotations.push(`rotateZ(${rotateZ}deg)`)
    if (this.isFlipped(item, context)) rotations.push('rotateY(180deg)')
    return rotations
  }

  getRotateZ(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): number {
    return 0
  }

  content = ({ itemId, context, highlight, playDown, children }: MaterialContentProps<P, M, L, ItemId>) => {
    const image = this.getImage(itemId, context)
    const backImage = this.getBackImage(itemId, context)
    const size = this.getSize(itemId, context)
    const borderRadius = this.getBorderRadius(itemId, context)
    return <>
      <div css={[
        faceCss,
        this.getFrontExtraCss(itemId, context),
        sizeCss(size.width, size.height),
        image && [backgroundCss(image), shadowCss(image)],
        borderRadius && borderRadiusCss(borderRadius),
        highlight ? shineEffect : playDown && playDownCss(image)
      ]}>
        {children}
      </div>
      {backImage && <div css={[
        faceCss,
        this.getBackExtraCss(itemId, context),
        sizeCss(size.width, size.height),
        backgroundCss(backImage), shadowCss(backImage),
        borderRadius && borderRadiusCss(borderRadius),
        transformCss('rotateY(-180deg)'),
        highlight && shineEffect, playDown && playDownCss(backImage)
      ]}/>}
    </>
  }

  getFrontExtraCss(_itemId: ItemId, _context: MaterialContext<P, M, L>): Interpolation<Theme> {
    return
  }

  getBackExtraCss(_itemId: ItemId, _context: MaterialContext<P, M, L>): Interpolation<Theme> {
    return
  }
}

export function isFlatMaterialDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
(description: MaterialDescription<P, M, L, ItemId>): description is FlatMaterialDescription<P, M, L, ItemId> {
  return typeof (description as FlatMaterialDescription<P, M, L, ItemId>).isFlipped === 'function'
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
