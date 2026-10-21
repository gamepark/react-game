import { describe, expect, it } from 'vitest'
import { alignTransforms } from './alignTransforms.util'

describe('aligned transforms', () => {
  it('give the function only one list holds a counterpart that does nothing', () => {
    const [origin, target] = alignTransforms(
      ['translate(-50%, -50%)', 'translate3d(1em, 2em, 0em)', 'rotateY(0deg)', 'translate3d(0em, -1em, 0.05em)'],
      ['translate(-50%, -50%)', 'translate3d(9em, 4em, 0em)', 'scale(0.5)', 'rotateY(180deg)', 'translate3d(0em, -1em, 0.05em)']
    )
    expect(origin).toEqual(['translate(-50%, -50%)', 'translate3d(1em, 2em, 0em)', 'scale(1)', 'rotateY(0deg)', 'translate3d(0em, -1em, 0.05em)'])
    expect(target).toEqual(['translate(-50%, -50%)', 'translate3d(9em, 4em, 0em)', 'scale(0.5)', 'rotateY(180deg)', 'translate3d(0em, -1em, 0.05em)'])
  })

  it('leave lists of the same functions as they are', () => {
    const origin = ['translate3d(1em, 2em, 0em)', 'rotateZ(10deg)']
    const target = ['translate3d(3em, 2em, 0em)', 'rotateZ(20deg)']
    expect(alignTransforms(origin, target)).toEqual([origin, target])
  })

  it('give up on a function that cannot be given a counterpart', () => {
    const origin = ['translate3d(1em, 2em, 0em)']
    const target = ['matrix(1, 0, 0, 1, 0, 0)', 'translate3d(1em, 2em, 0em)']
    expect(alignTransforms(origin, target)).toEqual([origin, target])
  })
})
