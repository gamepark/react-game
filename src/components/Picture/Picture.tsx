import { forwardRef, HTMLAttributes, ImgHTMLAttributes } from 'react'

export type PictureAttributes = ImgHTMLAttributes<HTMLImageElement> & {
  picture?: HTMLAttributes<HTMLElement>
}

export const Picture = forwardRef<HTMLImageElement, PictureAttributes>(({ picture, alt, ...props }: PictureAttributes, ref) => {
  return (
    <picture {...picture}>
      <img ref={ref} draggable={false} alt={alt} {...props}/>
    </picture>
  )
})

Picture.displayName = 'Picture'
