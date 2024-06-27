export const adjustRotation = (targetTransforms: string[], sourceTransforms: string[]): string[] => {
  return targetTransforms.map((value, i) => toClosestRotation(value, sourceTransforms[i]))
}

const toClosestRotation = (target: string, source: string) => {
  if (!source) return target
  const sourceMatch = source.match(/rotate([^(]*)\((-?\d+\.?\d*)([^)]*)\)/)
  const targetMatch = target.match(/rotate([^(]*)\((-?\d+\.?\d*)([^)]*)\)/)
  if (!(sourceMatch && targetMatch)) return target
  const sourceAxis = sourceMatch[1].toLowerCase(), targetAxis = targetMatch[1].toLowerCase()
  if (!targetAxis || sourceAxis !== targetAxis) return target
  const sourceRotation = getRotationDegrees(parseFloat(sourceMatch[2]), sourceMatch[3])
  const targetRotation = getRotationDegrees(parseFloat(targetMatch[2]), targetMatch[3])
  const delta = Math.round((sourceRotation - targetRotation) / 360)
  if (delta === 0) return target
  return `rotate${targetAxis}(${targetRotation + delta * 360}deg)`
}

const getRotationDegrees = (value: number, unit: string) => unit === 'rad' ? value * 180 / Math.PI : value

