import { css, Interpolation, Theme } from '@emotion/react'
import { MaterialItem } from '@gamepark/rules-api'
import { range } from 'es-toolkit'
import { backgroundCss, borderRadiusCss, shadowEffect, shineEffect, transformCss } from '../../../css'
import { ItemContext } from '../../../locators'
import { MaterialContentProps } from '../MaterialDescription'
import { MobileMaterialDescription } from '../MobileMaterialDescription'

export abstract class CubicDiceDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends MobileMaterialDescription<P, M, L, ItemId> {
  width = 1.6
  ratio = 1
  borderRadius = 0.3
  color = '#000000'
  abstract images: string[] | Record<any, string[]>

  getImages(): string[] {
    return Array.isArray(this.images) ? this.images : Object.values(this.images).flat()
  }

  getDiceImages(itemId: ItemId) {
    return Array.isArray(this.images) ? this.images : this.images[itemId]
  }

  getColor(_itemId: ItemId) {
    return this.color
  }

  content = ({ itemId, highlight, preview, playDown = preview }: MaterialContentProps<ItemId>) => {
    const internalMask = css`
      position: absolute;
      top: 1px;
      left: 1px;
      width: calc(${this.width}em - 2px);
      height: calc(${this.width}em - 2px);
      background-color: ${this.getColor(itemId)};
      border-radius: ${this.borderRadius / 2}em;
    `
    const images = this.getDiceImages(itemId)
    return <>
      {range(6).map((_, index) =>
        <div key={index} css={[
          css`
            position: absolute;
            transform-style: preserve-3d;
            width: ${this.width}em;
            height: ${this.width}em;
          `,
          backgroundCss(images[index]),
          highlight ? shineEffect : playDown && shadowEffect,
          borderRadiusCss(this.borderRadius),
          this.getSideTransform(index)
        ]}/>
      )}
      <div css={internalMask}/>
      <div css={[internalMask, css`transform: rotateX(90deg)`]}/>
      <div css={[internalMask, css`transform: rotateY(90deg)`]}/>
    </>
  }

  getSideTransform(index: number): Interpolation<Theme> {
    switch (index) {
      case 0:
        return transformCss(`translateZ(${this.width / 2}em)`)
      case 1:
        return transformCss(`translateY(${this.width / 2}em)`, 'rotateX(-90deg)')
      case 2:
        return transformCss(`translateX(${this.width / 2}em)`, 'rotateY(90deg)')
      case 3:
        return transformCss(`translateX(-${this.width / 2}em)`, 'rotateY(-90deg)')
      case 4:
        return transformCss(`translateY(-${this.width / 2}em)`, 'rotateX(90deg)')
      default:
        return transformCss(`translateZ(-${this.width / 2}em)`, 'rotateY(180deg)')
    }
  }

  getItemTransform(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string[] {
    return super.getItemTransform(item, context).concat(`translateZ(${this.width / 2}em)`, ...this.getRotations(item, context))
  }

  getRotations(item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): string[] {
    switch (item.location.rotation) {
      case 1:
        return ['rotateX(90deg)']
      case 2:
        return ['rotateY(-90deg)']
      case 3:
        return ['rotateY(90deg)']
      case 4:
        return ['rotateX(-90deg)']
      case 5:
        return ['rotateY(-180deg)']
      default:
        return []
    }
  }

  getHelpDisplayExtraCss(item: Partial<MaterialItem<P, L>>, context: ItemContext<P, M, L>): Interpolation<Theme> {
    return item.location && [transformCss(...this.getRotations(item as MaterialItem<P, L>, context)), css`
      margin: ${this.width / 4}em;
    `]
  }
}