/** @jsxImportSource @emotion/react */
import { useCallback, useRef } from 'react'
import { Picture } from '../Picture'
import { useWebP } from '../../hooks'

type Props = {
  images: string[]
  onImagesLoad?: () => void
}

export const ImagesLoader = ({ images, onImagesLoad }: Props) => {
  const webp = useWebP()
  const loadCount = useRef(0)
  const onLoad = useCallback(() => {
    loadCount.current++
    if (onImagesLoad && loadCount.current === images.length) {
      onImagesLoad()
    }
  }, [onImagesLoad])
  if (webp === undefined) return null
  return (
    <>
      {images.map((image, index) => <Picture key={index} src={image} alt="" style={{ display: 'none' }} onLoad={onLoad}/>)}
    </>
  )
}
