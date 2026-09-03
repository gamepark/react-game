import { Animation } from '@gamepark/react-client'
import { CreateItem, CreateItemsAtOnce, MaterialRules } from '@gamepark/rules-api'
import { ItemContext } from '../../../locators'
import { CreateItemAnimations } from './CreateItemAnimations'
import { MaterialGameAnimationContext } from './MaterialGameAnimations'
import { Trajectory } from './Trajectory'

/**
 * How long items created together fly for, unless the game says otherwise: not at all.
 *
 * {@link CreateItemsAtOnce} is the move a game reaches for to create many items in one small payload —
 * a whole setup, a deck, a supply — and watching a hundred of them fly in one by one is neither wanted
 * nor affordable. So the animation exists but is silent until it is asked for, and a game that wants
 * it says so on the moves it wants it on (see {@link CreateItemsAtOnceAnimations}).
 */
export const defaultCreateAtOnceDuration = 0

/**
 * The quantities of every item of the type, as they stood before the move was applied. Captured at
 * BEFORE_MOVE and read back at AFTER_MOVE within the same reducer pass: the reducer plays one move at
 * a time and always asks for both durations, so one slot is enough — {@link CreateItemAnimations} keeps
 * its own for the same reason.
 */
let pendingSnapshot: (number | undefined)[] | undefined

/** One item the move created: where it landed, and which of its copies are the new ones. */
type CreatedItem = { index: number, displayIndexes: [number, number] }

/**
 * The items of a {@link CreateItemsAtOnce} move flying in from the stock, exactly as a single creation
 * does — several at a time, all leaving together.
 *
 * Everything a single creation does is inherited, {@link CreateItemAnimations.getItemAnimation} included:
 * only *which* items are the new ones is answered differently. They are read off the game rather than
 * predicted — the quantities of the type are snapshotted before the move and compared after it — so an
 * item that merged into an existing stack animates as surely as one that took an index of its own,
 * whatever the location strategies did with them in between.
 *
 * Silent unless the game asks, {@link defaultCreateAtOnceDuration} being 0, and silent all the way down:
 * nothing is snapshotted and nothing is compared while the duration is 0, so the bulk creations this
 * move exists for cost exactly what they used to.
 *
 * @example
 * ```ts
 * animations.configure(and(isMaterial(MaterialType.Pawn), isMoveType(ItemMoveType.CreateAtOnce))).duration(1000)
 * ```
 *
 * The three methods below take a creation of either shape, though only the batch one ever reaches them:
 * a class may not narrow what it inherits to an unrelated type, and a creation of one item and a creation
 * of several are exactly that — one carries an `item`, the other a list of `items`. Neither method reads
 * either field: what they need, `itemType`, both shapes carry.
 */
export class CreateItemsAtOnceAnimations<P extends number = number, M extends number = number, L extends number = number, R extends number = number, V extends number = number>
  extends CreateItemAnimations<P, M, L, R, V> {

  constructor(duration = defaultCreateAtOnceDuration, trajectory?: Trajectory<P, M, L>) {
    super(duration, trajectory)
  }

  override getPreDuration(move: CreateItem<P, M, L> | CreateItemsAtOnce<P, M, L>, context: MaterialGameAnimationContext<P, M, L, R, V>): number {
    if (this.duration <= 0) return 0
    const rules = new context.Rules(context.game, { player: context.playerId }) as MaterialRules<P, M, L, R, V>
    const items = rules.game.items?.[move.itemType] ?? []
    pendingSnapshot = items.map((item: any) => item.quantity)
    return 0
  }

  override getPostDuration(move: CreateItem<P, M, L> | CreateItemsAtOnce<P, M, L>, context: MaterialGameAnimationContext<P, M, L, R, V>): number {
    const snapshot = pendingSnapshot
    pendingSnapshot = undefined
    // No snapshot means BEFORE_MOVE never ran for this move: without it every item of the type would
    // read as brand new, so the whole material would fly in from the stock. Nothing is safer.
    if (this.duration <= 0 || !snapshot) return 0
    const rules = new context.Rules(context.game, { player: context.playerId }) as MaterialRules<P, M, L, R, V>
    const items: any[] = rules.game.items?.[move.itemType] ?? []
    const createdItems: CreatedItem[] = []
    for (let index = 0; index < items.length; index++) {
      const before = index < snapshot.length ? (snapshot[index] ?? 1) : 0
      const after = items[index]?.quantity ?? 1
      if (after > before) createdItems.push({ index, displayIndexes: [before, after - 1] })
    }
    // Stored on the action (Immer draft) for use in isItemToAnimate. Under a key of its own: an action
    // may carry a single creation before this one, and neither must read the other's data.
    context.action.animationData = { createdItems }
    return createdItems.length ? this.duration : 0
  }

  override isItemToAnimate(context: ItemContext<P, M, L, R, V>, animation: Animation<CreateItem<P, M, L> | CreateItemsAtOnce<P, M, L>>): boolean {
    const { type, index, displayIndex } = context
    const createdItems: CreatedItem[] | undefined = animation.action.animationData?.createdItems
    if (!createdItems || animation.move.itemType !== type) return false
    return createdItems.some(item => item.index === index && displayIndex >= item.displayIndexes[0] && displayIndex <= item.displayIndexes[1])
  }
}
