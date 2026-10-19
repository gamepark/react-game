import { describe, expect, it } from 'vitest'
import { getEasingProgress, getElevationKeyframes, getFadeKeyframes, getLandingElevationKeyframes } from './Trajectory'

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

/** The translateZ of each keyframe of an arc, by percent */
const arcFrames = (styles: string) =>
  new Map([...styles.matchAll(/([\d.]+)%\s*\{\s*transform:\s*translateZ\(([-\d.]+)(?:em)?\);?\s*\}/g)].map((match): [number, number] => [+match[1], +match[2]]))

describe('easing progress', () => {
  it('follows the CSS keywords and cubic-bezier()', () => {
    expect(getEasingProgress('linear')!(0.3)).toBeCloseTo(0.3, 5)
    expect(getEasingProgress('ease-in-out')!(0.5)).toBeCloseTo(0.5, 5)
    expect(getEasingProgress('ease-in')!(0.5)).toBeCloseTo(0.3153, 3)
    expect(getEasingProgress('ease-out')!(0.5)).toBeCloseTo(0.6847, 3)
    expect(getEasingProgress('cubic-bezier(0.42, 0, 1, 1)')!(0.5)).toBeCloseTo(0.3153, 3)
    expect(getEasingProgress('ease')!(0)).toBe(0)
    expect(getEasingProgress('ease')!(1)).toBe(1)
  })

  it('gives up on the easings it cannot follow', () => {
    expect(getEasingProgress('steps(4)')).toBeUndefined()
  })
})

describe('landing arc', () => {
  it('holds the depth of the destination from the landing on', () => {
    const depth = 1
    const progress = getEasingProgress('ease-in-out')!
    const frames = arcFrames(getLandingElevationKeyframes({ height: 10, landAt: 0.6 }, 'ease-in-out', depth).styles)
    expect(frames.get(0)).toBe(0)
    expect(frames.get(100)).toBe(0)
    // From the landing on, the arc is what the item still has to go: the item and its arc reach the destination depth
    for (const [percent, elevation] of frames) {
      if (percent >= 60) expect(elevation + depth * progress(percent / 100)).toBeCloseTo(depth, 3)
    }
    // Before the landing, it still flies above
    expect(frames.get(30)).toBeGreaterThan(9)
  })

  it('is the plain arc with no depth to make up, or an easing it cannot follow', () => {
    const config = { height: 10, landAt: 0.6 }
    expect(getLandingElevationKeyframes(config, 'ease-in-out', 0).styles).toBe(getElevationKeyframes(config).styles)
    expect(getLandingElevationKeyframes(config, 'steps(4)', 1).styles).toBe(getElevationKeyframes(config).styles)
    expect(getLandingElevationKeyframes({ height: 10 }, 'ease-in-out', 1).styles).toBe(getElevationKeyframes({ height: 10 }).styles)
  })
})
