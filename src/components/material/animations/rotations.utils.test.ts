// @ts-nocheck
import { describe, expect, it } from 'vitest'
import { mirrorTransforms } from './rotations.utils'

describe('mirrorTransforms', () => {
  it('mirrors what a hand asks for, keeping the list the length it was', () => {
    const hover = ['translateY(-2em)', 'translateZ(10em)', 'rotateZ(-4deg)', 'scale(2)']
    expect(mirrorTransforms(hover)).toEqual(['translateY(-2em)', 'translateZ(-10em)', 'rotateZ(4deg)', 'scale(2)'])
  })

  it('leaves y, rotateY and every scale alone', () => {
    expect(mirrorTransforms(['translateY(3em)', 'rotateY(30deg)', 'scaleX(2)', 'scale3d(1, 2, 3)', 'perspective(100em)'])).toEqual([
      'translateY(3em)',
      'rotateY(30deg)',
      'scaleX(2)',
      'scale3d(1, 2, 3)',
      'perspective(100em)'
    ])
  })

  it('flips the sign of x and z, and of the angles around them', () => {
    expect(mirrorTransforms(['translateX(1.5em)', 'translateZ(-2em)', 'rotateX(10deg)', 'rotateZ(0.5rad)', 'rotate(90deg)'])).toEqual([
      'translateX(-1.5em)',
      'translateZ(2em)',
      'rotateX(-10deg)',
      'rotateZ(-0.5rad)',
      'rotate(-90deg)'
    ])
  })

  it('handles the compound translations and the arbitrary axis', () => {
    expect(mirrorTransforms(['translate(1em, 2em)', 'translate(3em)', 'translate3d(1em, 2em, 3em)', 'rotate3d(1, 2, 3, 45deg)'])).toEqual([
      'translate(-1em, 2em)',
      'translate(-3em)',
      'translate3d(-1em, 2em, -3em)',
      'rotate3d(-1, 2, -3, 45deg)'
    ])
  })

  it('gives up on anything it cannot mirror, so the caller can wrap instead', () => {
    expect(mirrorTransforms(['translateZ(calc(1em + 2px))'])).toBeUndefined()
    expect(mirrorTransforms(['matrix(1, 0, 0, 1, 0, 0)'])).toBeUndefined()
    expect(mirrorTransforms(['skewX(10deg)'])).toBeUndefined()
    expect(mirrorTransforms(['translateZ(var(--x))'])).toBeUndefined()
  })

  it('is its own inverse', () => {
    const hover = ['translateY(-2em)', 'translateZ(10em)', 'rotateZ(-4deg)', 'scale(2)']
    expect(mirrorTransforms(mirrorTransforms(hover))).toEqual(hover)
  })
})
