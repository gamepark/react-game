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
  unit === targetUnit ? value : value * angleUnitValue[targetUnit as keyof typeof angleUnitValue] / angleUnitValue[unit as keyof typeof angleUnitValue]

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

/**
 * Adjust every rotateZ in `targetTransforms` to the equivalent angle closest to the origin's total
 * rotation, WITHOUT mutating `originTransforms`.
 *
 * Unlike {@link toClosestRotations}, the origin is treated as a fixed reference. This is required for
 * "to-only" keyframes (dropped items): there the animation's implicit "from" is the element's actual
 * inline transform (already normalized to [0, 2π) by {@link toSingleRotation}), so the target must
 * stay in that same convention. Re-baselining the target toward 0 (as toClosestRotations does) would
 * leave e.g. a 270° item with a -90° target, i.e. a 360° gap animated as a full spin.
 */
export const alignTargetRotationsToOrigin = (originTransforms: string[], targetTransforms: string[]): void => {
  const rotationRegex = /rotateZ?\((-?\d+\.?\d*)([^)]*)\)/
  const originAngle = originTransforms.reduce((sum, transform) => {
    const match = transform.match(rotationRegex)
    return match ? sum + convertAngle(parseFloat(match[1]), match[2]) : sum
  }, 0)
  for (let i = 0; i < targetTransforms.length; i++) {
    const match = targetTransforms[i].match(rotationRegex)
    if (match) {
      const targetAngle = convertAngle(parseFloat(match[1]), match[2])
      const delta = Math.round((originAngle - targetAngle) / (2 * Math.PI))
      if (delta !== 0) {
        targetTransforms[i] = `rotateZ(${targetAngle + delta * 2 * Math.PI}rad)`
      }
    }
  }
}

export const removeRotations = (transforms: string[]): string[] => toSingleRotation(transforms).filter(transform => !transform.startsWith('rotate'))

/**
 * The same transforms, read in a frame that has been turned over by a rotateY(180deg): x and z change sign while
 * y does not, so a translateZ that lifts an item towards the player has to push it away instead, and a rotateZ
 * has to turn the other way round.
 *
 * Written this way rather than by wrapping the list in rotateY(-180deg) ... rotateY(180deg), which computes the
 * same thing but is 2 functions longer: a transition towards a longer list interpolates those 2 rotations from 0,
 * and everything between them is read in a half turned frame along the way, which swings the item sideways before
 * it settles. Mirroring each function in place keeps the list the length it was, so every step of a transition is
 * a step towards the answer.
 *
 * Undefined when the list holds something this cannot mirror, leaving the caller to fall back on wrapping.
 */
export const mirrorTransforms = (transforms: string[]): string[] | undefined => {
  const mirrored: string[] = []
  for (const transform of transforms) {
    const result = mirrorTransform(transform)
    if (result === undefined) return undefined
    mirrored.push(result)
  }
  return mirrored
}

const mirrorTransform = (transform: string): string | undefined => {
  const match = transform.match(/^\s*([a-zA-Z0-9]+)\(([^)]*)\)\s*$/)
  if (!match) return undefined
  const [, fn, args] = match
  const values = args.split(',').map(value => value.trim())
  switch (fn) {
    // Along y, or not a direction at all: a half turn around y leaves these alone.
    case 'translateY':
    case 'rotateY':
    case 'scale':
    case 'scaleX':
    case 'scaleY':
    case 'scaleZ':
    case 'scale3d':
    case 'perspective':
      return transform
    // Along x or z, or an angle around one of them: all of them change sign.
    case 'translateX':
    case 'translateZ':
    case 'rotate':
    case 'rotateX':
    case 'rotateZ':
      return rebuild(fn, [negate(values[0])])
    // translate takes its y as an option, so an absent one stays absent rather than counting as a failure.
    case 'translate': {
      const x = negate(values[0])
      if (x === undefined) return undefined
      return values[1] === undefined ? `translate(${x})` : `translate(${x}, ${values[1]})`
    }
    case 'translate3d':
      return rebuild(fn, [negate(values[0]), values[1], negate(values[2])])
    // A rotation around an arbitrary axis: the axis is mirrored, the angle is not.
    case 'rotate3d':
      return rebuild(fn, [negate(values[0]), values[1], negate(values[2]), values[3]])
    default:
      return undefined
  }
}

const rebuild = (fn: string, values: (string | undefined)[]): string | undefined =>
  values.some(value => value === undefined) ? undefined : `${fn}(${values.filter(value => value !== undefined).join(', ')})`

/** The same value with its sign flipped, keeping its unit. Undefined for anything that is not a plain number. */
const negate = (value: string | undefined): string | undefined => {
  const match = value?.match(/^(-?\d*\.?\d+)([a-z%]*)$/)
  return match ? `${-parseFloat(match[1])}${match[2]}` : undefined
}
