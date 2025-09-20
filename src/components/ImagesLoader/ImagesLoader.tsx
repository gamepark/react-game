import { useRef } from 'react'
import { Picture } from '../Picture'

export type ImagesLoaderProps = {
  images: string[]
  onImagesLoad?: () => void
}

export const ImagesLoader = ({ images, onImagesLoad }: ImagesLoaderProps) => {
  const loadCount = useRef(0)
  const onLoad = () => {
    loadCount.current++
    if (onImagesLoad && loadCount.current === images.length) {
      onImagesLoad()
    }
  }
  if (onImagesLoad && images.length === 0) {
    setTimeout(onImagesLoad)
  }
  return (
    <>
      {images.map((image, index) => <Picture key={index} src={image} alt="" style={{ display: 'none' }} onLoad={onLoad}/>)}
    </>
  )
}
