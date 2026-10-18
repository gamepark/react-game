import { describe, expect, it } from 'vitest'
import { getFadeKeyframes } from './Trajectory'

describe('fade keyframes', () => {
  it('fade nothing without a fade', () => {
    expect(getFadeKeyframes(undefined)).toBeUndefined()
    expect(getFadeKeyframes({})).toBeUndefined()
    expect(getFadeKeyframes({ in: 0, out: 0 })).toBeUndefined()
  })

  it('fade the item out at the end only', () => {
    const styles = getFadeKeyframes({ out: 0.2 })!.styles.replace(/\s/g, '')
    expect(styles).toContain('0%{opacity:1;}')
    expect(styles).toContain('80%{opacity:1;}')
    expect(styles).toContain('100%{opacity:0;}')
  })

  it('fade the item in at the start only', () => {
    const styles = getFadeKeyframes({ in: 0.25 })!.styles.replace(/\s/g, '')
    expect(styles).toContain('0%{opacity:0;}')
    expect(styles).toContain('25%{opacity:1;}')
    expect(styles).toContain('100%{opacity:1;}')
  })

  it('never let the fade out start before the fade in is over', () => {
    const styles = getFadeKeyframes({ in: 0.7, out: 0.5 })!.styles.replace(/\s/g, '')
    expect(styles).toContain('70%{opacity:1;}')
    expect(styles).toContain('100%{opacity:0;}')
    expect(styles).not.toContain('50%')
  })
})
