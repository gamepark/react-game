/** @jsxImportSource @emotion/react */
import { css, Interpolation, Theme } from '@emotion/react'
import { MaterialItem } from '@gamepark/rules-api'
import { range } from 'es-toolkit'
import { backgroundCss, shadowEffect, shineEffect, transformCss } from '../../../css'
import { ItemContext } from '../../../locators'
import { MaterialContentProps } from '../MaterialDescription'
import { MobileMaterialDescription } from '../MobileMaterialDescription'

const TILT = 35.26 // 90 - arctan(sqrt(2)) in degrees
const TZ_RATIO = 0.2562 // translateZ / width ratio for octahedron

/**
 * 8-faced (octahedral) dice with CSS 3D transforms.
 *
 * The `images` array must contain exactly 8 images, one per face:
 *
 *   - **images[0–3]**: top faces (triangles pointing up)
 *   - **images[4–7]**: bottom faces (triangles pointing down)
 *
 * Within each half, faces are arranged by cardinal direction:
 *
 *   | Index | Half   | Direction |
 *   |-------|--------|-----------|
 *   |   0   |  top   |  front    |
 *   |   1   |  top   |  right    |
 *   |   2   |  top   |  back     |
 *   |   3   |  top   |  left     |
 *   |   4   | bottom |  front    |
 *   |   5   | bottom |  right    |
 *   |   6   | bottom |  back     |
 *   |   7   | bottom |  left     |
 *
 * `location.rotation` (0–7) selects which face is shown on top.
 * Top face images should have their symbol shifted toward the base of the triangle (centroid offset).
 * Bottom face images should be rotated 180° with the symbol shifted the opposite way.
 */
export abstract class OctahedralDiceDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends MobileMaterialDescription<P, M, L, ItemId> {
  width = 2
  ratio = 1
  borderRadius = 0
  color = '#222222'
  abstract images: string[] | Record<any, string[]>
  /** Set to true to display face index labels (0-7) for debugging */
  debugFaceLabels = false

  private get tz() { return this.width * TZ_RATIO }

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
    const images = this.getDiceImages(itemId)
    const w = this.width
    const tz = this.tz

    const sideCss = css`
      position: absolute;
      width: ${w}em;
      height: ${w}em;
      backface-visibility: hidden;
    `

    const diamondTopCss = css`
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
      backface-visibility: hidden;
      transform: translateY(50%) rotate(30deg) skewY(30deg) scaleX(0.866);
      filter: drop-shadow(0 0 0.03em rgba(0, 0, 0, 0.5));
    `

    const diamondBottomCss = css`
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
      backface-visibility: hidden;
      transform: translateY(-50%) rotate(30deg) skewY(30deg) scaleX(0.866);
      filter: drop-shadow(0 0 0.03em rgba(0, 0, 0, 0.5));
    `

    const contentTopCss = css`
      display: block;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      background-color: ${this.getColor(itemId)};
      transform: scaleX(1.155) skewY(-30deg) rotate(-30deg) translateY(-50%);
    `

    const contentBottomCss = css`
      display: block;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      background-color: ${this.getColor(itemId)};
      transform: scaleX(1.155) skewY(-30deg) rotate(-30deg) translateY(50%);
    `

    const faceLabelCss = this.debugFaceLabels ? css`
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: ${w * 0.3}em;
      font-weight: bold;
      color: red;
      pointer-events: none;
      z-index: 1;
    ` : undefined

    return <>
      {range(8).map((_, index) => {
        const yRot = (index % 4) * 90
        // Bottom faces are offset by 180° so that rotateX(180deg) brings face N to the top
        const bottomYRot = ((index % 4) * 90 + 180) % 360
        const sideTransform = index < 4
          ? transformCss(
            index > 0 ? `rotateY(${yRot}deg)` : undefined,
            `rotateX(${TILT}deg)`,
            `translateZ(${tz}em)`
          )
          : transformCss(
            `translateY(52%)`,
            bottomYRot > 0 ? `rotateY(${bottomYRot}deg)` : undefined,
            `rotateX(${-TILT}deg)`,
            `translateZ(${tz}em)`
          )

        return <div key={index} css={[sideCss, sideTransform]}>
          <div css={index < 4 ? diamondTopCss : diamondBottomCss}>
            <div css={[
              index < 4 ? contentTopCss : contentBottomCss,
              backgroundCss(images[index]),
              highlight ? shineEffect : playDown && shadowEffect
            ]}>
              {faceLabelCss && <span css={faceLabelCss}>{index}</span>}
            </div>
          </div>
        </div>
      })}
    </>
  }

  getItemTransform(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string[] {
    return super.getItemTransform(item, context).concat(`translateZ(${this.tz}em)`, ...this.getRotations(item, context))
  }

  getRotations(item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): string[] {
    switch (item.location.rotation) {
      case 0: return []
      case 1: return ['rotateY(-90deg)']
      case 2: return ['rotateY(-180deg)']
      case 3: return ['rotateY(90deg)']
      case 4: return ['rotateX(180deg)']
      case 5: return ['rotateX(180deg)', 'rotateY(90deg)']
      case 6: return ['rotateX(180deg)', 'rotateY(180deg)']
      case 7: return ['rotateX(180deg)', 'rotateY(-90deg)']
      default: return []
    }
  }

  getHelpDisplayExtraCss(item: Partial<MaterialItem<P, L>>, context: ItemContext<P, M, L>): Interpolation<Theme> {
    return item.location && [transformCss(...this.getRotations(item as MaterialItem<P, L>, context)), css`
      margin: ${this.width / 4}em;
    `]
  }
}
