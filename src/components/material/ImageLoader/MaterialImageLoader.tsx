import { FC, useContext, useMemo } from 'react'
import { gameContext } from '../../GameProvider'
import { ImagesLoader, ImagesLoaderProps } from '../../ImagesLoader'
import { useMaterials } from '../../../hooks/useMaterials'

type MaterialImageLoaderProps = Omit<ImagesLoaderProps, 'images'>;

const useMaterialImages = (): string[] => {
  const descriptions = useMaterials()
  return useMemo(() => {
    if (!descriptions) {
      return []
    }
    return Object.values(descriptions).flatMap((description) => description.getImages())
  }, [descriptions])
}

const MaterialImageLoader: FC<MaterialImageLoaderProps> = (props) => {
  const images = useMaterialImages()

  return <ImagesLoader images={images} {...props} />
}

export {
  MaterialImageLoader
}
