import { useDndContext } from '@dnd-kit/core'
import { MaterialItem } from '@gamepark/rules-api'
import { isEqual } from 'es-toolkit'
import { createContext, PointerEvent, ReactNode, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
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
 * The hover of the items of the table that carry it to the items placed on them (see {@link carriesHover}).
 *
 * A hover in CSS only reaches the hovered element. The items placed on another item (the cards on a player board, the
 * tokens on those cards…) are not inside its element: they are drawn beside it on the table. The hover is therefore
 * kept here, so that each item placed on a hovered item can add the same transform to its own (see ItemContext.hovered).
 *
 * - `pointed` is the item under the mouse pointer.
 * - `held` is an item pointed before, kept hovered while the pointer stays in the hovered area: the bounding box of the
 *   hovered items at rest and as they are shown, and of the items placed on them. The pointer may then cross a gap
 *   between two cards of an enlarged board, or a part of the table that the board left when it was moved, without the
 *   board shrinking under it.
 * - During a drag, the dragged item is under the pointer and the items under it receive no pointer event: the pointer
 *   is followed instead, and the item that carries its hover is found by its place at rest.
 */
class HoveredItemStore {
  private pointed?: HoveredItem
  private held?: HoveredItem
  private pendingLeave?: ReturnType<typeof setTimeout>
  private position?: { x: number, y: number }
  private listeners = new Set<() => void>()
  /** The elements of the hovered items and of the items placed on them: together they make the hovered area. */
  private areaElements = new Set<Element>()
  /** The items that carry their hover, by the element of their place at rest. */
  private carriers = new Map<Element, HoveredItem>()
  /** Called when the hover changes, to measure again the drop areas during a drag. */
  onChange?: () => void

  /** The items whose parents are hovered: the item pointed and the item held. */
  getAnchors = (): HoveredItem[] => [this.pointed, this.held].filter((item): item is HoveredItem => item !== undefined)

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  enter(item: HoveredItem) {
    clearTimeout(this.pendingLeave)
    this.pendingLeave = undefined
    const held = this.isInArea() ? this.held ?? this.pointed : undefined
    this.set(item, held)
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
      if (!this.pointed || !isSameItem(this.pointed, item)) return
      this.set(undefined, this.isInArea() ? this.held ?? item : undefined)
    })
  }

  move = (event: globalThis.PointerEvent) => {
    if (event.pointerType !== 'mouse') return
    this.position = { x: event.clientX, y: event.clientY }
    if (this.isInArea()) return
    if (event.buttons) {
      // A drag: the item that carries its hover under the pointer is found by its place at rest
      const carrier = [...this.carriers.entries()].find(([element]) => contains(element.getBoundingClientRect(), this.position!))?.[1]
      if (carrier) {
        if (!this.pointed || !isSameItem(this.pointed, carrier)) this.set(carrier, undefined)
      } else if (this.pointed || this.held) {
        this.set(undefined, undefined)
      }
    } else if (this.held) {
      this.set(this.pointed, undefined)
    }
  }

  addToArea(element: Element) {
    this.areaElements.add(element)
    return () => {
      this.areaElements.delete(element)
    }
  }

  addCarrier(element: Element, item: HoveredItem) {
    this.carriers.set(element, item)
    return () => {
      this.carriers.delete(element)
    }
  }

  private isInArea() {
    if (!this.position || !this.areaElements.size) return false
    const rects = [...this.areaElements].map(element => element.getBoundingClientRect())
    const box = {
      left: Math.min(...rects.map(rect => rect.left)),
      right: Math.max(...rects.map(rect => rect.right)),
      top: Math.min(...rects.map(rect => rect.top)),
      bottom: Math.max(...rects.map(rect => rect.bottom))
    }
    return contains(box, this.position)
  }

  private set(pointed: HoveredItem | undefined, held: HoveredItem | undefined) {
    if (isSameOrBothUndefined(pointed, this.pointed) && isSameOrBothUndefined(held, this.held)) return
    this.pointed = pointed
    this.held = held
    for (const listener of this.listeners) listener()
    this.onChange?.()
  }
}

const isSameOrBothUndefined = (a?: HoveredItem, b?: HoveredItem) => a && b ? isSameItem(a, b) : a === b

const contains = (rect: { left: number, right: number, top: number, bottom: number }, { x, y }: { x: number, y: number }) =>
  x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom

const HoveredItemContext = createContext<HoveredItemStore | undefined>(undefined)

/**
 * The hovered items are measured again by dnd-kit during a drag once the hover transition is over (0.2s, see
 * carriedHoverCss of ItemDisplay): the drop areas on an enlarged board are then where they are shown.
 */
const remeasureDelay = 250

export const HoveredItemProvider = ({ children }: { children?: ReactNode }) => {
  const storeRef = useRef<HoveredItemStore>(undefined)
  if (!storeRef.current) storeRef.current = new HoveredItemStore()
  const store = storeRef.current
  const { active, droppableContainers, measureDroppableContainers } = useDndContext()
  const dnd = useRef({ active, droppableContainers, measureDroppableContainers })
  dnd.current = { active, droppableContainers, measureDroppableContainers }
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined
    store.onChange = () => {
      if (!dnd.current.active) return
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        const { active, droppableContainers, measureDroppableContainers } = dnd.current
        if (active) measureDroppableContainers([...droppableContainers.keys()])
      }, remeasureDelay)
    }
    document.addEventListener('pointermove', store.move, true)
    return () => {
      clearTimeout(timeout)
      store.onChange = undefined
      document.removeEventListener('pointermove', store.move, true)
    }
  }, [store])
  return <HoveredItemContext.Provider value={store}>{children}</HoveredItemContext.Provider>
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
 * is pointed or held and each item it is placed on, as long as they carry their hover.
 */
const getHovered = (anchors: HoveredItem[], item: HoveredItem, context: MaterialContext): HoveredItem[] => {
  if (!anchors.length) return []
  const anchorChains = anchors.flatMap(anchor => getItemAndParents(anchor, context))
  return getItemAndParents(item, context).filter(candidate => anchorChains.some(a => isSameItem(a, candidate)) && carriesHover(candidate, context))
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
 *
 * Give `element` (the element of the item at rest) to make the item part of the hovered area while it is hovered, and
 * to let a drag find it when it carries its hover.
 */
export function useHoveredItems(type: number, index: number, item: MaterialItem, element?: { current: Element | null }) {
  const store = useContext(HoveredItemContext)
  const context = useMaterialContextRef()
  const carries = element !== undefined && carriesHover({ type, index, item }, context)
  // A string, so that the item is rendered again only when its hover changes
  const getSnapshot = () => store ? getHovered(store.getAnchors(), { type, index, item }, context).map(h => `${h.type}_${h.index}`).join('|') : ''
  const key = useSyncExternalStore(store?.subscribe ?? noSubscription, getSnapshot, getSnapshot)
  const hovered = useMemo(() => key && store ? getHovered(store.getAnchors(), { type, index, item }, context) : undefined, [key, store, type, index, item, context])
  const listeners = useMemo<HoverListeners>(() => store ? {
    onPointerEnter: (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && !event.buttons) store.enter({ type, index, item })
    },
    onPointerLeave: (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && !event.buttons) store.leave({ type, index, item })
    }
  } : noHover, [store, type, index, item])

  // Hovered, the item is part of the hovered area: at rest, and as it is shown (the content of an item that carries its hover)
  useEffect(() => {
    const target = element?.current
    if (!store || !target || !key) return
    const removals = [store.addToArea(target)]
    if (carries && target.firstElementChild) removals.push(store.addToArea(target.firstElementChild))
    return () => removals.forEach(remove => remove())
  }, [store, element, key, carries])

  useEffect(() => {
    const target = element?.current
    if (!store || !target || !carries) return
    return store.addCarrier(target, { type, index, item })
  }, [store, element, carries, type, index, item])

  return { hovered, listeners }
}
