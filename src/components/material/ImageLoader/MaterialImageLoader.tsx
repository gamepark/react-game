import { FC, useContext, useMemo } from 'react'
import { gameContext } from '../../GameProvider'
import { ImagesLoader, ImagesLoaderProps } from '../../ImagesLoader'

type MaterialImageLoaderProps = Omit<ImagesLoaderProps, 'images'>;

const MaterialImageLoader: FC<MaterialImageLoaderProps> = (props) => {
  const context = useContext(gameContext)
  const images = useMemo(() => {
    const images: string[] = []
    for (const description of Object.values(context.material ?? {})) {
      if (description) images.push(...description.getImages())
    }
    for (const locator of Object.values(context.locators ?? {})) {
      if (locator?.locationDescription) images.push(...locator.locationDescription.getImages())
    }
    return images
  }, [context.material, context.locators])

  return <ImagesLoader images={images} {...props} />
}

export {
  MaterialImageLoader
}
