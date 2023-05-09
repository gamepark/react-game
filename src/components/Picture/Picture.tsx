/** @jsxImportSource @emotion/react */
import { forwardRef, HTMLAttributes, ImgHTMLAttributes, useMemo } from 'react'

export type PictureAttributes = ImgHTMLAttributes<HTMLImageElement> & {
  picture?: HTMLAttributes<HTMLElement>
}

export const Picture = forwardRef<HTMLImageElement, PictureAttributes>(({ picture, alt, ...props }: PictureAttributes, ref) => {
  const srcTest = useMemo(() => props.src ? props.src.match(/(.*)\.(jpg|png)$/) : null, [props.src])
  return (
    <picture {...picture}>
      {srcTest && <source srcSet={srcTest[1] + '.webp'} type="image/webp"/>}
      <img ref={ref} draggable={false} alt={alt} {...props}/>
    </picture>
  )
})
