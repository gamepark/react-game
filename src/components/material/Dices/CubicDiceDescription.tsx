/** @jsxImportSource @emotion/react */
import { css, Interpolation, Theme } from '@emotion/react'
import { MaterialItem } from '@gamepark/rules-api'
import range from 'lodash/range'
import { backgroundCss, borderRadiusCss, shadowEffect, shineEffect, transformCss } from '../../../css'
import { ItemContext, MaterialContext } from '../../../locators'
import { MaterialContentProps } from '../MaterialDescription'
import { MobileMaterialDescription } from '../MobileMaterialDescription'

export abstract class CubicDiceDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends MobileMaterialDescription<P, M, L, ItemId> {
  width = 1.6
  ratio = 1
  borderRadius = 0.3
  color = '#000000'
  abstract images: string[] | Record<any, string>

  getImages(): string[] {
    return Array.isArray(this.images) ? this.images : Object.values(this.images)
  }

  getDiceImages(itemId: ItemId, _context: MaterialContext<P, M, L>) {
    return Array.isArray(this.images) ? this.images : this.images[itemId]
  }

  getColor(_itemId: ItemId) {
    return this.color
  }

  getSideId(index: number, _itemId: ItemId): any {
    return index
  }

  content = ({ itemId, highlight, playDown }: MaterialContentProps<ItemId>) => {
    const internalMask = css`
      position: absolute;
      top: 1px;
      left: 1px;
      width: calc(${this.width}em - 2px);
      height: calc(${this.width}em - 2px);
      background-color: ${this.getColor(itemId)};
      border-radius: ${this.borderRadius / 2}em;
    `
    return <>
      {range(6).map((_, index) =>
        <div key={index} css={[
          css`
            position: absolute;
            transform-style: preserve-3d;
            width: ${this.width}em;
            height: ${this.width}em;
          `,
          backgroundCss(this.images[this.getSideId(index, itemId)]),
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
}