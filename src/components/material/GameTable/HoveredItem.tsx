import { MaterialItem } from '@gamepark/rules-api'
import { isEqual } from 'es-toolkit'
import { createContext, PointerEvent, ReactNode, useContext, useMemo, useRef, useSyncExternalStore } from 'react'
import { useMaterialContextRef } from '../../../hooks/useMaterialContextRef'
import { Locator, MaterialContext } from '../../../locators'

/**
 * An item of the table: its type, its index (among the items of the game, or among the static items of its type), and
 * the item itself, which tells apart a static item from an item of the game with the same index.
 */
export type HoveredItem<M extends number = number> = {
  type: M
  index: number
  item: MaterialItem
}

const isSameItem = (a: HoveredItem, b: HoveredItem) => a.type === b.type && a.index === b.index && isEqual(a.item, b.item)

/**
 * The item under the mouse pointer, shared by all the items of the table.
 *
 * A hover in CSS only reaches the hovered element. The items placed on another item (the cards on a player board, the
 * tokens on those cards…) are not inside its element: they are drawn beside it on the table. For an item that carries
 * its hover to the items placed on it (see {@link carriesHover}), the hover is therefore kept here, so that each item
 * placed on it can add the same transform to its own (see ItemContext.hovered).
 */
class HoveredItemStore {
  private pointed?: HoveredItem
  private pendingLeave?: ReturnType<typeof setTimeout>
  private listeners = new Set<() => void>()

  get = () => this.pointed

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  enter(item: HoveredItem) {
    clearTimeout(this.pendingLeave)
    this.pendingLeave = undefined
    this.set(item)
  }

  /**
   * When the pointer goes from an item to the next one, the browser sends the leave first. The leave is delayed, so that
   * a board does not shrink for one frame when the pointer goes from it onto a card placed on it.
   */
  leave(item: HoveredItem) {
    if (!this.pointed || !isSameItem(this.pointed, item)) return
    clearTimeout(this.pendingLeave)
    this.pendingLeave = setTimeout(() => {
      this.pendingLeave = undefined
      if (this.pointed && isSameItem(this.pointed, item)) this.set(undefined)
    })
  }

  private set(item?: HoveredItem) {
    if (item === this.pointed || (item && this.pointed && isSameItem(item, this.pointed))) return
    this.pointed = item
    for (const listener of this.listeners) listener()
  }
}

const HoveredItemContext = createContext<HoveredItemStore | undefined>(undefined)

export const HoveredItemProvider = ({ children }: { children?: ReactNode }) => {
  const store = useRef<HoveredItemStore>(undefined)
  if (!store.current) store.current = new HoveredItemStore()
  return <HoveredItemContext.Provider value={store.current}>{children}</HoveredItemContext.Provider>
}

/**
 * The item itself, then the item it is placed on, and so on up to an item that is not placed on another one. The parent
 * of an item is found by its locator (see Locator.getParentItem): it may be a static item.
 */
export function getItemAndParents(hovered: HoveredItem, context: MaterialContext): HoveredItem[] {
  const result: HoveredItem[] = []
  let current: HoveredItem | undefined = hovered
  while (current && result.length < 10) {
    result.push(current)
    const locator: Locator | undefined = context.locators[current.item.location.type]
    const parentType: number | undefined = locator?.parentItemType
    const parentItem: MaterialItem | undefined = parentType !== undefined ? locator?.getParentItem(current.item.location, context) : undefined
    current = parentType !== undefined && parentItem ? { type: parentType, index: getItemIndex(parentType, parentItem, current.item, context), item: parentItem } : undefined
  }
  return result
}

/** The index of a parent item: given by the location of its child, or else its rank among the static items of its type. */
const getItemIndex = (type: number, parentItem: MaterialItem, child: MaterialItem, context: MaterialContext): number => {
  if (child.location.parent !== undefined) return child.location.parent
  return context.material[type]?.getStaticItems(context).findIndex(item => isEqual(item, parentItem)) ?? -1
}

/**
 * An item carries its hover to the items placed on it when its description asks for it (hoverCarriesChildren), it has a
 * hover transform and items can be placed on it: those items are then enlarged with it, instead of staying behind.
 */
export function carriesHover({ type, index, item }: HoveredItem, context: MaterialContext): boolean {
  const description = context.material[type]
  if (!description?.hoverCarriesChildren) return false
  if (!Object.values(context.locators).some(locator => locator?.parentItemType === type)) return false
  return description.getHoverTransform(item, { ...context, type, index, displayIndex: 0 }).length > 0
}

/**
 * The items, among an item and the items it is placed on, that are hovered and carry their hover to it: the item that
 * is pointed and each item it is placed on, as long as they carry their hover.
 */
const getHovered = (pointed: HoveredItem | undefined, item: HoveredItem, context: MaterialContext): HoveredItem[] => {
  if (!pointed) return []
  const pointedChain = getItemAndParents(pointed, context)
  return getItemAndParents(item, context).filter(candidate => pointedChain.some(p => isSameItem(p, candidate)) && carriesHover(candidate, context))
}

type HoverListeners = {
  onPointerEnter?: (event: PointerEvent) => void
  onPointerLeave?: (event: PointerEvent) => void
}

const noHover: HoverListeners = {}
const noSubscription = () => () => {}

/**
 * The hover of an item displayed on the table: the items, among itself and the items it is placed on, that are
 * hovered and carry their hover to it, and the pointer listeners that keep the hover up to date. Outside a game
 * table (in a help dialog for instance), there is no hover.
 */
export function useHoveredItems(type: number, index: number, item: MaterialItem) {
  const store = useContext(HoveredItemContext)
  const context = useMaterialContextRef()
  // A string, so that the item is rendered again only when its hover changes
  const getSnapshot = () => store ? getHovered(store.get(), { type, index, item }, context).map(h => `${h.type}_${h.index}`).join('|') : ''
  const key = useSyncExternalStore(store?.subscribe ?? noSubscription, getSnapshot, getSnapshot)
  const hovered = useMemo(() => key && store ? getHovered(store.get(), { type, index, item }, context) : undefined, [key, store, type, index, item, context])
  const listeners = useMemo<HoverListeners>(() => store ? {
    onPointerEnter: (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && !event.buttons) store.enter({ type, index, item })
    },
    onPointerLeave: (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && !event.buttons) store.leave({ type, index, item })
    }
  } : noHover, [store, type, index, item])
  return { hovered, listeners }
}
