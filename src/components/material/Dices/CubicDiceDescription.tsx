/** @jsxImportSource @emotion/react */
import { css, Interpolation, Theme } from '@emotion/react'
import { flatten } from 'lodash'
import { MaterialItem } from '../../../../../workshop/packages/rules-api'
import { backgroundCss, borderRadiusCss, shadowEffect, shineEffect, transformCss } from '../../../css'
import { ItemContext, MaterialContext } from '../../../locators'
import { MaterialContentProps, MaterialDescription } from '../MaterialDescription'

export abstract class CubicDiceDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends MaterialDescription<P, M, L, ItemId> {
  width = 1.6
  ratio = 1
  borderRadius = 0.3
  color = '#000000'
  abstract images: string[] | Record<any, string[]>

  getImages(): string[] {
    return Array.isArray(this.images) ? this.images : flatten(Object.values(this.images))
  }

  getDiceImages(itemId: ItemId, _context: MaterialContext<P, M, L>) {
    return Array.isArray(this.images) ? this.images : this.images[itemId]
  }

  getColor(_itemId: ItemId, _context: MaterialContext<P, M, L>) {
    return this.color
  }

  content = ({ itemId, context, highlight, playDown }: MaterialContentProps<P, M, L, ItemId>) => {
    const images = this.getDiceImages(itemId, context)
    const internalMask = css`
      position: absolute;
      width: calc(${this.width}em - 2px);
      height: calc(${this.width}em - 2px);
      background-color: ${this.getColor(itemId, context)};
      transform: translateZ(-${this.borderRadius}em);
      border-radius: ${this.borderRadius / 2}em;
    `
    return <>
      {images.map((image, index) =>
        <div key={index} css={[
          css`
            position: absolute;
            transform-style: preserve-3d;
            width: calc(${this.width}em);
            height: calc(${this.width}em);
          `,
          backgroundCss(image),
          highlight ? shineEffect : playDown && shadowEffect,
          borderRadiusCss(this.borderRadius),
          this.getSideTransform(index)
        ]}>
          <div css={internalMask}/>
        </div>
      )}
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

  getRotation(item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): string {
    switch (item.location.rotation) {
      case 1:
        return 'rotateX(90deg)'
      case 2:
        return 'rotateY(-90deg)'
      case 3:
        return 'rotateY(90deg)'
      case 4:
        return 'rotateX(-90deg)'
      case 5:
        return 'rotateY(-180deg)'
      default:
        return ''
    }
  }
}