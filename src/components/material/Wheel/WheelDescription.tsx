/** @jsxImportSource @emotion/react */
import { Interpolation, Theme } from '@emotion/react'
import { MaterialContentProps } from '../MaterialDescription'
import { MobileMaterialDescription } from '../MobileMaterialDescription'
import { WheelItem } from './WheelItem'

export class WheelDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends MobileMaterialDescription<P, M, L, ItemId> {

  image?: string
  images?: Record<ItemId extends keyof any ? ItemId : never, string>

  getImage(itemId: ItemId): string | undefined {
    return this.images?.[itemId as keyof any] ?? this.image
  }

  wheelImage?: string
  wheelImages?: Record<ItemId extends keyof any ? ItemId : never, string>

  getWheelImage(itemId: ItemId): string | undefined {
    return this.wheelImages?.[itemId as keyof any] ?? this.wheelImage
  }

  angle: number = 20
  angles?: number[]

  getAngles(_itemId: ItemId): number[] {
    if (this.angles === undefined) {
      this.angles = []
      let angle = 0
      while (angle < 360) {
        this.angles.push(angle)
        angle += this.angle
      }
    }

    return this.angles
  }

  getExtraCss(_itemId: ItemId): Interpolation<Theme> {
    return
  }

  getWheelExtraCss(_itemId: ItemId): Interpolation<Theme> {
    return
  }

  getImages(): string[] {
    const images: string[] = []
    if (this.image) images.push(this.image)
    if (this.images) images.push(...Object.values(this.images) as string[])
    if (this.wheelImage) images.push(this.wheelImage)
    if (this.wheelImages) images.push(...Object.values(this.wheelImages) as string[])
    return images
  }

  content = (props: MaterialContentProps<ItemId>) => {
    const { itemId } = props
    const image = this.getImage(itemId)
    const wheelImage = this.getWheelImage(itemId)
    const size = this.getSize(itemId)
    const borderRadius = this.getBorderRadius(itemId)
    const angles = this.getAngles(itemId)
    const extraCss = this.getExtraCss(itemId)
    const wheelExtraCss = this.getWheelExtraCss(itemId)
    return (
      <WheelItem
        image={image}
        wheelImage={wheelImage}
        size={size}
        borderRadius={borderRadius}
        angles={angles}
        extraCss={extraCss}
        wheelExtraCss={wheelExtraCss}
        {...props}
      />
    )
  }
}