/** @jsxImportSource @emotion/react */
import { css, Interpolation, Theme } from '@emotion/react'
import { MaterialItem } from '@gamepark/rules-api'
import { backgroundCss, borderRadiusCss, shadowCss, shadowEffect, shineEffect, sizeCss, transformCss } from '../../../css'
import { ItemContext, MaterialContext } from '../../../locators'
import { MaterialContentProps, MaterialDescription } from '../MaterialDescription'
import { MobileMaterialDescription } from '../MobileMaterialDescription'

export abstract class FlatMaterialDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends MobileMaterialDescription<P, M, L, ItemId> {

  image?: string
  images?: Record<ItemId extends keyof any ? ItemId : never, string>

  getImage(itemId: ItemId): string | undefined {
    return this.images?.[this.getFrontId(itemId)] ?? this.image
  }

  backImage?: string
  backImages?: Record<ItemId extends keyof any ? ItemId : never, string>

  getBackImage(itemId: ItemId): string | undefined {
    return this.backImages?.[this.getBackId(itemId)] ?? this.backImage
  }

  getImages(): string[] {
    const images: string[] = []
    if (this.image) images.push(this.image)
    if (this.images) images.push(...Object.values(this.images) as string[])
    if (this.backImage) images.push(this.backImage)
    if (this.backImages) images.push(...Object.values(this.backImages) as string[])
    return images
  }

  protected getFrontId(itemId: ItemId) {
    return typeof itemId === 'object' ? (itemId as any).front : itemId as keyof any
  }

  protected getBackId(itemId: ItemId) {
    return typeof itemId === 'object' ? (itemId as any).back : itemId as keyof any
  }

  protected hasBackFace() {
    return !!this.backImage || !!this.backImages
  }

  isFlipped(item: Partial<MaterialItem<P, L>>, _context: MaterialContext<P, M, L>): boolean {
    return this.hasBackFace() && this.getFrontId(item.id) === undefined
  }

  getItemTransform(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string[] {
    const transform = super.getItemTransform(item, context)
    if (this.isFlipped(item, context)) transform.push('rotateY(180deg)')
    return transform
  }

  content = ({ itemId, highlight, playDown, children }: MaterialContentProps<ItemId>) => {
    const image = this.getImage(itemId)
    const backImage = this.getBackImage(itemId)
    const size = this.getSize(itemId)
    const borderRadius = this.getBorderRadius(itemId)
    return <>
      <div css={[
        faceCss,
        this.getFrontExtraCss(itemId),
        sizeCss(size.width, size.height),
        image && [backgroundCss(image), shadowCss(image)],
        borderRadius && borderRadiusCss(borderRadius),
        highlight ? shineEffect : (playDown && playDownCss(image))
      ]}>
        {children}
      </div>
      {backImage && <div css={[
        faceCss,
        this.getBackExtraCss(itemId),
        sizeCss(size.width, size.height),
        backgroundCss(backImage), shadowCss(backImage),
        borderRadius && borderRadiusCss(borderRadius),
        transformCss('rotateY(-180deg)'),
        highlight ? shineEffect : (playDown && playDownCss(backImage))
      ]}/>}
    </>
  }

  getFrontExtraCss(_itemId: ItemId): Interpolation<Theme> {
    return
  }

  getBackExtraCss(_itemId: ItemId): Interpolation<Theme> {
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
