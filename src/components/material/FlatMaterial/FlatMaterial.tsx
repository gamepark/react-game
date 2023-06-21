/** @jsxImportSource @emotion/react */
import { forwardRef, HTMLAttributes } from 'react'
import { backgroundCss, borderRadiusCss, preserve3d, shadowCss, sizeCss, transformCss } from '../../../css'
import { ComponentSize, MaterialDescription } from '../MaterialDescription'
import { css } from '@emotion/react'
import { MaterialItem } from '@gamepark/rules-api'

export type FlatMaterialProps = ComponentSize & {
  image?: string
  back?: {
    image?: string
  }
  borderRadius?: number
}

export const FlatMaterial = forwardRef<HTMLDivElement, FlatMaterialProps & HTMLAttributes<HTMLDivElement>>(
  ({ image, width, height, back, borderRadius, children, ...props }, ref) => {
    if (!back) {
      return (
        <div ref={ref} css={[
          sizeCss(width, height),
          image && [backgroundCss(image), shadowCss(image)],
          borderRadius && borderRadiusCss(borderRadius)
        ]} {...props}>
          {children}
        </div>
      )
    }
    // TODO: we should be able to define children locations inside the back face too
    return (
      <div ref={ref} css={[preserve3d, sizeCss(width, height), borderRadius && borderRadiusCss(borderRadius)]} {...props}>
        <div css={[faceCss, image && [backgroundCss(image), shadowCss(image)]]}>
          {children}
        </div>
        <div css={[faceCss, back.image && [backgroundCss(back.image), shadowCss(back.image)], transformCss('rotateY(-180deg)')]}/>
      </div>
    )
  }
)

const faceCss = css`
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: inherit;
  box-shadow: 0 0 0.1em black;
`

export abstract class FlatMaterialDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends MaterialDescription<P, M, L, ItemId> {

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

  borderRadius?: number

  getBorderRadius(_itemId: ItemId): number | undefined {
    return this.borderRadius
  }

  getFlatMaterialProps(itemId: ItemId): FlatMaterialProps {
    return {
      ...this.getSize(itemId),
      image: this.getImage(itemId),
      back: this.backImage || this.backImages ? { image: this.getBackImage(itemId) } : undefined,
      borderRadius: this.getBorderRadius(itemId)
    }
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

  isHidden(item: Partial<MaterialItem<P, L>>): boolean {
    return this.hasBackFace() && this.getFrontId(item.id) === undefined
  }
}

export function isFlatMaterialDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
(description: MaterialDescription<P, M, L, ItemId>): description is FlatMaterialDescription<P, M, L, ItemId> {
  return typeof (description as FlatMaterialDescription<P, M, L, ItemId>).getFlatMaterialProps === 'function'
}
