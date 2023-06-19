import { FC, useContext, useMemo } from 'react'
import { gameContext } from '../../GameProvider'
import { ImagesLoader, ImagesLoaderProps } from '../../ImagesLoader'

type MaterialImageLoaderProps = Omit<ImagesLoaderProps, 'images'>;

const useMaterialImages = (): string[] => {
  const descriptions = useContext(gameContext).material
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
