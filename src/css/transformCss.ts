import {css} from '@emotion/react'
import {Coordinates} from '@gamepark/rules-api'

export const transformCss = (...transformations: string[]) => css`
  transform: ${transformations.join(' ')};
`

export const getPositionTransforms = (position: Coordinates, rotation?: Partial<Coordinates>) => {
  const transforms = [`translate3d(${position.x}em, ${position.y}em, ${position.z}em)`]
  if (rotation?.x) transforms.push(`rotateX(${rotation?.x}deg)`)
  if (rotation?.y) transforms.push(`rotateY(${rotation?.y}deg)`)
  if (rotation?.z) transforms.push(`rotateZ(${rotation?.z}deg)`)
  return transforms
}