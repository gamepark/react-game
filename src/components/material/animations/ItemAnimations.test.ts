// @ts-nocheck
/**
 * @vitest-environment jsdom
 *
 * Nothing here touches the DOM: the class reaches the css index and the react-client store as it loads.
 */
import { describe, expect, it } from 'vitest'
// Through a concrete subclass: importing the base class first breaks the cycle of the animations index
import { MoveItemAnimations } from './MoveItemAnimations'

class TrajectoryKeyframes extends MoveItemAnimations {
  build(origin: string[], target: string[], waypoints) {
    return this.getTrajectoryKeyframes(origin, target, { duration: 1 }, { trajectory: { waypoints } }).styles
  }
}

describe('trajectory keyframes through waypoints', () => {
  it('keep the scale of an item drawn scaled at both ends', () => {
    const styles = new TrajectoryKeyframes().build(
      ['translate3d(0em, 0em, 0em)', 'scale(0.3)'],
      ['translate3d(10em, 0em, 0em)', 'scale(0.3)'],
      [{ at: 0.5, coordinates: { x: 5, y: 4 } }]
    )
    expect(styles.match(/scale\(0\.3\)/g)).toHaveLength(3)
  })

  it('go from one size to the other when the item changes size', () => {
    const styles = new TrajectoryKeyframes().build(['translate3d(0em, 0em, 0em)', 'scale(0.4)'], ['translate3d(10em, 0em, 0em)'], [{ at: 0.5, coordinates: { x: 5 } }])
    expect(styles).toContain('scale(0.4)')
    expect(styles).toContain('scale(0.7)')
    expect(styles).toContain('scale(1)')
  })

  it('add no scale to an item drawn at its own size', () => {
    const styles = new TrajectoryKeyframes().build(['translate3d(0em, 0em, 0em)'], ['translate3d(10em, 0em, 0em)'], [{ at: 0.5, coordinates: { x: 5 } }])
    expect(styles).not.toContain('scale')
  })
})
