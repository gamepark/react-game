/** @jsxImportSource @emotion/react */
import { forwardRef, HTMLAttributes } from 'react'
import { backgroundCss, ComponentSize, sizeCss } from '../../../css'
import { CommonMaterialDescription, extractImages, MaterialLocationsFunction, Translatable } from '../MaterialDescription'
import { MaterialComponentType } from '../MaterialComponentType'

export type BoardProps = {
  image: string
} & ComponentSize

export type TranslatableBoardProps = BoardProps & Translatable<BoardProps>

export const Board = forwardRef<HTMLDivElement, BoardProps & HTMLAttributes<HTMLDivElement>>(({ image, height, ratio, ...props }, ref) =>
  <div ref={ref} css={[sizeCss({ height, ratio }), backgroundCss(image)]} {...props}/>
)


export abstract class BoardMaterialDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any> extends CommonMaterialDescription<P, M, L, ItemId, TranslatableBoardProps> {
  type: typeof MaterialComponentType.Board = MaterialComponentType.Board

  getLocations?: MaterialLocationsFunction<ItemId>

  getImages() {
    return extractImages(this.props.image)
  }
}
