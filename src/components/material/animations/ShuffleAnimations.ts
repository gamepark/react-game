import { css, Interpolation, keyframes, Theme } from '@emotion/react'
import { Animation } from '@gamepark/react-client'
import { Shuffle } from '@gamepark/rules-api'
import { getItemFromContext, ItemContext } from '../../../locators'
import { ItemAnimations } from './ItemAnimations'
import { MaterialGameAnimationContext } from './MaterialGameAnimations'
import { transformItem } from './transformItem.util'

/**
 * Default duration of the shuffle animation, in seconds.
 */
export const defaultShuffleDuration = 1.5

/**
 * Fine tuning of the riffle played when items are shuffled.
 */
export type ShuffleAnimationConfig = {
  /**
   * How many times the items are cut apart and let back in.
   * @default 2
   */
  riffles?: number

  /**
   * How far the two packets pull apart, as a ratio of the item width.
   * @default 0.9
   */
  spread?: number

  /**
   * How high (in em) the items rise above the table while they are out of the pile.
   * @default 4
   */
  lift?: number

  /**
   * Sideways play given to the packets, as a ratio of the item height, so they don't look like two rigid blocks.
   * @default 0.15
   */
  jitter?: number
}

/**
 * Fallback size (in em) used to scale the movement when the item description cannot provide its size.
 */
const fallbackItemSize = { width: 5, height: 5 }

/**
 * Animation played when a {@link Shuffle} move is executed: the items are cut into two packets that pull
 * apart, then fall back into the pile one after the other, the way the two halves of a riffle shuffle
 * cascade back into each other.
 *
 * The shuffled items never actually change place on the front-end (the index swap only happens on the
 * back-end, unless the shuffle is visible), so the animation is pure show: what matters is that players
 * see the pile taken apart and put back together.
 *
 * The shape follows what card shuffles on the web settle on — an item leaves the pile along a single axis
 * and drops back into it at another depth, flat. Spinning the items on the way looked wrong here: a card
 * pulled out of a deck keeps its heading, and 20 of them turning at once reads as scattered debris rather
 * than as a shuffle.
 */
export class ShuffleAnimations<P extends number = number, M extends number = number, L extends number = number, R extends number = number, V extends number = number>
  extends ItemAnimations<P, M, L, R, V> {

  constructor(private duration = defaultShuffleDuration, private config: ShuffleAnimationConfig = {}) {
    super()
  }

  override getPostDuration(_move: Shuffle<M>, _context: MaterialGameAnimationContext<P, M, L, R, V>): number {
    return this.duration
  }

  getItemAnimation(context: ItemContext<P, M, L, R, V>, animation: Animation<Shuffle<M>>): Interpolation<Theme> {
    if (context.type !== animation.move.itemType || !animation.move.indexes.includes(context.index)) return
    const item = getItemFromContext(context)
    const locator = context.locators[item.location.type]
    // Items removed from the DOM (typically the cards below a deck's display limit) must not pop into
    // view just to take part in the shuffle: only what the player already sees is animated.
    if (locator?.hide(item, context) || locator?.ignore(item, context)) return
    return this.getShuffledItemAnimation(context, animation)
  }

  getShuffledItemAnimation(context: ItemContext<P, M, L, R, V>, animation: Animation<Shuffle<M>>): Interpolation<Theme> {
    const originTransforms = transformItem(context)
    if (!originTransforms.length) return
    const { elevationKeyframes, movementKeyframes } = this.getShuffleKeyframes(originTransforms, context, animation)
    // Same split as every other item animation: the elevation goes on the wrapper, which is the element
    // living in the table's 3D scene, and the displacement goes on the item itself (`> *`), where it adds
    // up to the transform the locator gave it instead of replacing it.
    return css`
      animation: ${elevationKeyframes} ${animation.duration}s ease-in-out forwards;

      > * {
        animation: ${movementKeyframes} ${animation.duration}s ease-in-out forwards;
      }
    `
  }

  protected getShuffleKeyframes(originTransforms: string[], context: ItemContext<P, M, L, R, V>, animation: Animation<Shuffle<M>>) {
    const { riffles = 2, spread = 0.9, lift = 4, jitter = 0.15 } = this.config
    const { width, height } = this.getItemSize(context)
    const random = mulberry32(getItemSeed(context, animation.move))
    const origin = originTransforms.join(' ')

    // Every keyframe must list the exact same transform operations in the same order, otherwise browsers
    // fall back to matrix decomposition between two frames and the item snaps instead of gliding.
    const movementFrame = (x: number, y: number) => `translate3d(${round(x)}em, ${round(y)}em, 0em) ${origin}`

    const movements = [`0% { transform: ${movementFrame(0, 0)}; }`]
    const elevations = ['0% { transform: translateZ(0em); }']
    const window = 1 / riffles
    for (let riffle = 0; riffle < riffles; riffle++) {
      const start = riffle * window
      // Which of the two packets this item is cut into, drawn again at every riffle so that each one looks
      // like a fresh cut rather than the same two blocks going back and forth.
      const side = random() < 0.5 ? -1 : 1
      // The item's rank in the cascade. Everything below is spaced out by it: the items leave the pile in
      // a wave and drop back in one after the other, which is what makes a riffle read as a riffle rather
      // than as two blocks moving as one.
      const rank = random()
      // The packets have to stay apart long enough to be read as two packets: they are pulled apart over the
      // first quarter of the riffle, held, then let back in over the last quarter.
      const outAt = start + (0.08 + 0.14 * rank) * window
      const backAt = start + (0.62 + 0.36 * rank) * window
      const x = side * spread * width
      const y = (random() * 2 - 1) * jitter * height
      movements.push(`${round(outAt * 100)}% { transform: ${movementFrame(x, y)}; }`)
      movements.push(`${round(backAt * 100)}% { transform: ${movementFrame(0, 0)}; }`)
      elevations.push(`${round(outAt * 100)}% { transform: translateZ(${round((0.6 + 0.4 * random()) * lift)}em); }`)
      elevations.push(`${round(backAt * 100)}% { transform: translateZ(0em); }`)
    }
    movements.push(`100% { transform: ${movementFrame(0, 0)}; }`)
    elevations.push('100% { transform: translateZ(0em); }')

    return {
      movementKeyframes: keyframes`${movements.join('\n')}`,
      elevationKeyframes: keyframes`${elevations.join('\n')}`
    }
  }

  /**
   * Reference size (in em) used to scale the movement.
   */
  protected getItemSize(context: ItemContext<P, M, L, R, V>): { width: number, height: number } {
    const description = context.material[context.type]
    if (!description) return fallbackItemSize
    try {
      return description.getSize(getItemFromContext(context).id)
    } catch {
      // getSize throws when the description declares neither size nor ratio: fall back on a sane default.
      return fallbackItemSize
    }
  }
}

/**
 * The keyframes are rebuilt on every render while the animation runs: the randomness must be derived from
 * the item and the move, never from Math.random, or the item would restart a brand new animation each time.
 */
function getItemSeed<P extends number, M extends number, L extends number, R extends number, V extends number>(
  { type, index, displayIndex }: ItemContext<P, M, L, R, V>, move: Shuffle<M>
): number {
  let seed = Math.imul(type + 1, 0x85ebca6b) ^ Math.imul(index + 1, 0xc2b2ae35) ^ Math.imul(displayIndex + 1, 0x27d4eb2f)
  for (const shuffledIndex of move.indexes) {
    seed = Math.imul(seed ^ shuffledIndex, 0x9e3779b1)
  }
  return seed
}

/**
 * Small deterministic pseudo-random number generator (mulberry32): same seed always gives the same sequence.
 */
function mulberry32(seed: number): () => number {
  let state = seed | 0
  return () => {
    state = state + 0x6d2b79f5 | 0
    let t = Math.imul(state ^ state >>> 15, 1 | state)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
