import { Coordinates } from '@gamepark/rules-api'

export const adjustRotation = (targetTransforms: string[], sourceTransforms: string[]): string[] => {
  const result: string[] = []
  const sourceRotation = sumRotationsDegrees(sourceTransforms)
  const targetRotation = sumRotationsDegrees(targetTransforms)
  for (const axis in sourceRotation) {
    const delta = Math.round((sourceRotation[axis] - targetRotation[axis]) / 360)
    if (delta) result.push(`rotate${axis.toUpperCase()}(${delta * 360}deg)`)
  }
  return targetTransforms.concat(result)
}

const sumRotationsDegrees = (transforms: string[]): Coordinates => {
  const rotations: Coordinates = { x: 0, y: 0, z: 0 }
  for (const transform of transforms) {
    const rotateMatch = transform.match(/rotate([^(]*)\((-?\d+\.?\d*)([^)]*)\)/)
    if (rotateMatch) {
      const axis = rotateMatch[1].toLowerCase(), value = parseFloat(rotateMatch[2]), unit = rotateMatch[3]
      if (axis in rotations) {
        switch (unit) {
          case 'deg':
            rotations[axis] += value
            break
          case 'rad':
            rotations[axis] += value * 180 / Math.PI
            break
        }
      }
    }
  }
  return rotations
}
