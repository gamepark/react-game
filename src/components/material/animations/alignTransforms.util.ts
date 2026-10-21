/**
 * The name of a CSS transform function: "translate3d" for "translate3d(1em, 2em, 0em)"
 */
const functionName = (transform: string) => transform.slice(0, transform.indexOf('(')).trim()

/** The transform functions that leave an item as it is, by name (none for matrix and perspective: they cannot be inserted) */
const identities: Record<string, string> = {
  translate: 'translate(0px, 0px)',
  translateX: 'translateX(0px)',
  translateY: 'translateY(0px)',
  translateZ: 'translateZ(0px)',
  translate3d: 'translate3d(0px, 0px, 0px)',
  scale: 'scale(1)',
  scaleX: 'scaleX(1)',
  scaleY: 'scaleY(1)',
  scaleZ: 'scaleZ(1)',
  scale3d: 'scale3d(1, 1, 1)',
  rotate: 'rotate(0deg)',
  rotateX: 'rotateX(0deg)',
  rotateY: 'rotateY(0deg)',
  rotateZ: 'rotateZ(0deg)',
  skew: 'skew(0deg)',
  skewX: 'skewX(0deg)',
  skewY: 'skewY(0deg)'
}

/**
 * Two lists of transforms with the same functions, in the same order, so that a CSS animation from one to the other
 * interpolates each function with its counterpart. A browser does that by itself only when one list is the beginning
 * of the other: it then pads the shorter one with functions that do nothing. Otherwise it interpolates the whole matrices,
 * and the item takes another way than its parent: an item laid on a card, whose list holds the place of the card before
 * its own place on it, would cross the card when the card turns over or changes size on its way.
 *
 * The functions the lists share are kept in their order (longest common sequence of names), and the function that only
 * one list holds gets its counterpart that does nothing in the other one.
 *
 * @returns the 2 aligned lists, or the lists as they are when a function cannot be given a counterpart (matrix…)
 */
export const alignTransforms = (origin: string[], target: string[]): [string[], string[]] => {
  const a = origin.map(functionName)
  const b = target.map(functionName)
  // Longest common sequence of the function names
  const lengths = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lengths[i][j] = a[i] === b[j] ? lengths[i + 1][j + 1] + 1 : Math.max(lengths[i + 1][j], lengths[i][j + 1])
    }
  }
  const alignedOrigin: string[] = []
  const alignedTarget: string[] = []
  let i = 0
  let j = 0
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      alignedOrigin.push(origin[i++])
      alignedTarget.push(target[j++])
    } else if (j < b.length && (i === a.length || lengths[i][j + 1] >= lengths[i + 1][j])) {
      const identity = identities[b[j]]
      if (!identity) return [origin, target]
      alignedOrigin.push(identity)
      alignedTarget.push(target[j++])
    } else {
      const identity = identities[a[i]]
      if (!identity) return [origin, target]
      alignedOrigin.push(origin[i++])
      alignedTarget.push(identity)
    }
  }
  return [alignedOrigin, alignedTarget]
}
