import { css, Interpolation, Theme } from '@emotion/react'
import { MaterialItem } from '@gamepark/rules-api'
import { ReactNode } from 'react'
import { backgroundCss, borderRadiusCss, playDownCss, shadowCss, shineEffect, sizeCss, transformCss } from '../../../css'
import { ItemContext, MaterialContext } from '../../../locators'
import { MaterialContentProps } from '../MaterialDescription'
import { MobileMaterialDescription } from '../MobileMaterialDescription'

export abstract class FlatMaterialDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any, R extends number = number, V extends number = number>
  extends MobileMaterialDescription<P, M, L, ItemId, R, V> {

  /**
   * Front image(s) to display. Accepts a single image or an array of alternatives
   * from which one is randomly picked per displayed instance (see {@link getImage}).
   */
  image?: string | string[]

  /**
   * Front images indexed by item id. Each entry accepts a single image or an array
   * of alternatives from which one is randomly picked per displayed instance.
   */
  images?: Record<ItemId extends keyof any ? ItemId : never, string | string[]>

  /**
   * Returns the front image to display for a given item.
   * When several alternatives are configured (array of strings), a random one is
   * picked for each visual instance and memorized, so subsequent renders of the
   * same instance keep showing the same image.
   *
   * @param itemId Id of the item
   * @param itemIndex Index of the item in the game state (undefined for components rendered outside of the game table)
   * @param displayIndex Index of the visual copy when an item has `quantity > 1` (undefined when not applicable)
   */
  getImage(itemId: ItemId, itemIndex?: number, displayIndex?: number): string | undefined {
    const frontId = this.getFrontId(itemId)
    const candidates = this.images?.[frontId as keyof typeof this.images] ?? this.image
    return this.pickImage('front', frontId, candidates, itemIndex, displayIndex)
  }

  backImage?: string | string[]
  backImages?: Record<ItemId extends keyof any ? ItemId : never, string | string[]>

  getBackImage(itemId: ItemId, itemIndex?: number, displayIndex?: number): string | undefined {
    const backId = this.getBackId(itemId)
    const candidates = this.backImages?.[backId as keyof typeof this.backImages] ?? this.backImage
    return this.pickImage('back', backId, candidates, itemIndex, displayIndex)
  }

  private pickedImages: Record<string, string> = {}

  private pickImage(face: 'front' | 'back', id: unknown, candidates: string | string[] | undefined,
                    itemIndex: number | undefined, displayIndex: number | undefined): string | undefined {
    if (!candidates) return
    if (typeof candidates === 'string') return candidates
    if (candidates.length <= 1) return candidates[0]
    const key = `${face}|${String(id)}|${itemIndex ?? ''}|${displayIndex ?? ''}`
    if (!this.pickedImages[key]) {
      this.pickedImages[key] = candidates[Math.floor(Math.random() * candidates.length)]
    }
    return this.pickedImages[key]
  }

  getImages(): string[] {
    const images: string[] = []
    if (this.image) images.push(...toArray(this.image))
    if (this.images) images.push(...(Object.values(this.images) as (string | string[])[]).flatMap(toArray))
    if (this.backImage) images.push(...toArray(this.backImage))
    if (this.backImages) images.push(...(Object.values(this.backImages) as (string | string[])[]).flatMap(toArray))
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

  isFlipped(item: Partial<MaterialItem<P, L, ItemId>>, _context: MaterialContext<P, M, L, R, V>): boolean {
    return this.hasBackFace() && this.getFrontId(item.id as ItemId) === undefined
  }

  isFlippedOnTable(item: Partial<MaterialItem<P, L, ItemId>>, context: MaterialContext<P, M, L, R, V>): boolean {
    return this.isFlipped(item, context)
  }

  isFlippedInDialog(item: Partial<MaterialItem<P, L, ItemId>>, context: MaterialContext<P, M, L, R, V>): boolean {
    return this.isFlipped(item, context)
  }

  getItemTransform(item: MaterialItem<P, L, ItemId>, context: ItemContext<P, M, L, R, V>): string[] {
    const transform = super.getItemTransform(item, context)
    if (this.isFlippedOnTable(item, context)) transform.push('rotateY(180deg)')
    return transform
  }

  content = (props: MaterialContentProps<ItemId, M>) => this.contentWithBackChildren(props)

  contentWithBackChildren = ({ itemId, itemIndex, displayIndex, highlight, playDown, preview, children, backChildren }: MaterialContentProps<ItemId, M> & { backChildren?: ReactNode }) => {
    const image = this.getImage(itemId, itemIndex, displayIndex)
    const backImage = this.getBackImage(itemId, itemIndex, displayIndex)
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

  getHoverTransform(item: MaterialItem<P, L, ItemId>, context: ItemContext<P, M, L, R, V>): string[] {
    const locator = context.locators[item.location.type]
    if (!locator || (this.backImage && this.isFlippedOnTable(item, context))) return []
    return locator.getHoverTransform(item, context)
  }

  getHelpDisplayExtraCss(item: Partial<MaterialItem<P, L, ItemId>>, context: ItemContext<P, M, L, R, V>): Interpolation<Theme> {
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

function toArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value]
}
