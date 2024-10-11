export const toSingleRotation = (transforms: string[]): string[] => {
  const result: string[] = []
  let rotateZ = 0
  const radTurn = angleUnitValue['rad']
  for (const transform of transforms) {
    const rotateZMatch = transform.match(/rotateZ?\((-?\d+\.?\d*)([^)]*)\)/)
    if (rotateZMatch) {
      rotateZ += convertAngle(parseFloat(rotateZMatch[1]), rotateZMatch[2])
    } else if (!transform.startsWith('translate')) {
      const applyRotate = ((rotateZ % radTurn) + radTurn) % radTurn
      if (applyRotate) result.push(`rotateZ(${applyRotate}rad)`)
      rotateZ = 0
      result.push(transform)
    } else if (Math.abs(rotateZ) % radTurn === 0) {
      result.push(transform)
    } else {
      const values = getTranslateValues(transform)
      if (!values) result.push(transform)
      else {
        const { x, y, z } = values
        const cos = Math.cos(rotateZ)
        const sin = Math.sin(rotateZ)
        result.push(`translate3d(${cos * x - sin * y}em, ${cos * y + sin * x}em, ${z}em)`)
      }
    }
  }
  const finalRotate = ((rotateZ % radTurn) + radTurn) % radTurn
  if (finalRotate) result.push(`rotateZ(${finalRotate}rad)`)
  return result
}

function getTranslateValues(transform: string): { x: number, y: number, z: number } | undefined {
  const translate3d = transform.match(/translate3d\((-?\d+\.?\d*)em, (-?\d+\.?\d*)em, (-?\d+\.?\d*)em\)/)
  if (translate3d) {
    return { x: parseFloat(translate3d[1]), y: parseFloat(translate3d[2]), z: parseFloat(translate3d[3]) }
  }
  const translate = transform.match(/translate\((-?\d+\.?\d*)em, (-?\d+\.?\d*)em\)/)
  if (translate) {
    return { x: parseFloat(translate[1]), y: parseFloat(translate[2]), z: 0 }
  }
  const translateX = transform.match(/translateX?\((-?\d+\.?\d*)em\)/)
  if (translateX) {
    return { x: parseFloat(translateX[1]), y: 0, z: 0 }
  }
  const translateY = transform.match(/translateY\((-?\d+\.?\d*)em\)/)
  if (translateY) {
    return { x: 0, y: parseFloat(translateY[1]), z: 0 }
  }
  return
}

const angleUnitValue = {
  ['deg']: 360,
  ['grad']: 400,
  ['rad']: 2 * Math.PI,
  ['turn']: 1
}

const convertAngle = (value: number, unit: string, targetUnit: string = 'rad') =>
  unit === targetUnit ? value : value * angleUnitValue[targetUnit] / angleUnitValue[unit]

export const toClosestRotations = (originTransforms: string[], targetTransforms: string[]): void => {
  let lastOriginAngle = 0
  let lastTargetAngle = 0
  for (let i = 0; i < Math.max(originTransforms.length, targetTransforms.length); i++) {
    const originMatch = originTransforms[i]?.match(/rotateZ?\((-?\d+\.?\d*)([^)]*)\)/)
    if (originMatch) {
      const originAngle = convertAngle(parseFloat(originMatch[1]), originMatch[2])
      const delta = Math.round((lastTargetAngle - originAngle) / (2 * Math.PI))
      if (delta === 0) {
        lastOriginAngle = originAngle
      } else {
        lastOriginAngle = originAngle + delta * 2 * Math.PI
        originTransforms[i] = `rotateZ(${lastOriginAngle}rad)`
      }
    }
    const targetMatch = targetTransforms[i]?.match(/rotateZ?\((-?\d+\.?\d*)([^)]*)\)/)
    if (targetMatch) {
      const targetAngle = convertAngle(parseFloat(targetMatch[1]), targetMatch[2])
      const delta = Math.round((lastOriginAngle - targetAngle) / (2 * Math.PI))
      if (delta === 0) {
        lastTargetAngle = targetAngle
      } else {
        lastTargetAngle = targetAngle + delta * 2 * Math.PI
        targetTransforms[i] = `rotateZ(${lastTargetAngle}rad)`
      }
    }
  }
}

export const removeRotations = (transforms: string[]): string[] => toSingleRotation(transforms).filter(transform => !transform.startsWith('rotate'))
