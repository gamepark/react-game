import { css, Interpolation, Theme } from '@emotion/react'
import { MaterialItem } from '@gamepark/rules-api'
import { ReactNode } from 'react'
import { backgroundCss, borderRadiusCss, playDownCss, shadowCss, shineEffect, sizeCss, transformCss } from '../../../css'
import { ItemContext, MaterialContext } from '../../../locators'
import { MaterialContentProps } from '../MaterialDescription'
import { MobileMaterialDescription } from '../MobileMaterialDescription'

export abstract class FlatMaterialDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends MobileMaterialDescription<P, M, L, ItemId> {

  image?: string
  images?: Record<ItemId extends keyof any ? ItemId : never, string>

  getImage(itemId: ItemId): string | undefined {
    return this.images?.[this.getFrontId(itemId) as keyof typeof this.images] ?? this.image
  }

  backImage?: string
  backImages?: Record<ItemId extends keyof any ? ItemId : never, string>

  getBackImage(itemId: ItemId): string | undefined {
    return this.backImages?.[this.getBackId(itemId) as keyof typeof this.backImages] ?? this.backImage
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

  /**
   * If the items image has transparency (shadows must be handled inside the image if there is transparency)
   */
  transparency = false

  /**
   * Whether a specific item has transparency. Default to {@link transparency}
   * @param _itemId the item id
   */
  hasTransparency(_itemId: ItemId): boolean {
    return this.transparency
  }

  isFlipped(item: Partial<MaterialItem<P, L>>, _context: MaterialContext<P, M, L>): boolean {
    return this.hasBackFace() && this.getFrontId(item.id) === undefined
  }

  isFlippedOnTable(item: Partial<MaterialItem<P, L>>, context: MaterialContext<P, M, L>): boolean {
    return this.isFlipped(item, context)
  }

  isFlippedInDialog(item: Partial<MaterialItem<P, L>>, context: MaterialContext<P, M, L>): boolean {
    return this.isFlipped(item, context)
  }

  getItemTransform(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string[] {
    const transform = super.getItemTransform(item, context)
    if (this.isFlippedOnTable(item, context)) transform.push('rotateY(180deg)')
    return transform
  }

  content = (props: MaterialContentProps<ItemId>) => this.contentWithBackChildren(props)

  contentWithBackChildren = ({ itemId, highlight, playDown, preview, children, backChildren }: MaterialContentProps<ItemId> & { backChildren?: ReactNode }) => {
    const image = this.getImage(itemId)
    const backImage = this.getBackImage(itemId)
    const size = this.getSize(itemId)
    const borderRadius = this.getBorderRadius(itemId)
    const transparency = this.hasTransparency(itemId)
    return <>
      <div css={[
        faceCss,
        this.getFrontExtraCss(itemId),
        sizeCss(size.width, size.height),
        image && [backgroundCss(image), !transparency && shadowCss],
        borderRadius && borderRadiusCss(borderRadius),
        highlight ? shineEffect : (playDown && playDownCss(transparency)),
        preview && previewCss,
        // We must add a little of translateZ since Safari/Chrome on iOS consider the two faces at the same level, so the backface-visibility is wrongly applied
        transformCss('translateZ(0.001px)')
      ]}>
        {children}
      </div>
      {backImage && <div css={[
        faceCss,
        this.getBackExtraCss(itemId),
        sizeCss(size.width, size.height),
        backgroundCss(backImage), !transparency && shadowCss,
        borderRadius && borderRadiusCss(borderRadius),
        transformCss('rotateY(-180deg)'),
        highlight ? shineEffect : (playDown && playDownCss(transparency)),
        preview && previewCss
      ]}>
        {backChildren}
      </div>}
    </>
  }

  getFrontExtraCss(_itemId: ItemId): Interpolation<Theme> {
    return
  }

  getBackExtraCss(_itemId: ItemId): Interpolation<Theme> {
    return
  }

  getHoverTransform(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string[] {
    const locator = context.locators[item.location.type]
    if (!locator || (this.backImage && this.isFlippedOnTable(item, context))) return []
    return locator.getHoverTransform(item, context)
  }

  getHelpDisplayExtraCss(item: Partial<MaterialItem<P, L>>, context: ItemContext<P, M, L>): Interpolation<Theme> {
    return this.isFlippedInDialog(item, context) && transformCss('rotateY(180deg)')
  }
}

const faceCss = css`
  position: absolute;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
`

const previewCss = css`
  opacity: 0.7;
`
