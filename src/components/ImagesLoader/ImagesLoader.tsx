/** @jsxImportSource @emotion/react */
import { useRef } from 'react'
import { useWebP } from '../../hooks'
import { Picture } from '../Picture'

export type ImagesLoaderProps = {
  images: string[]
  onImagesLoad?: () => void
}

export const ImagesLoader = ({ images, onImagesLoad }: ImagesLoaderProps) => {
  const webp = useWebP()
  const loadCount = useRef(0)
  const onLoad = () => {
    loadCount.current++
    if (onImagesLoad && loadCount.current === images.length) {
      onImagesLoad()
    }
  }
  if (onImagesLoad && images.length === 0) {
    onImagesLoad()
  }
  if (webp === undefined) return null
  return (
    <>
      {images.map((image, index) => <Picture key={index} src={image} alt="" style={{ display: 'none' }} onLoad={onLoad}/>)}
    </>
  )
}
