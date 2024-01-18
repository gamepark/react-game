import { Location, LocationBuilder, Material, MaterialItem } from '../workshop/packages/rules-api'
import equal from 'fast-deep-equal'
import sumBy from 'lodash/sumBy'

export type FocusableElement<P extends number = number, M extends number = number, L extends number = number> =
  Material<P, M, L> | StaticItem<P, M, L> | LocationBuilder<P, L>
export type StaticItem<P extends number = number, M extends number = number, L extends number = number> = {
  type: M
  item: MaterialItem<P, L>
}

export function isItemFocus(itemType: number, itemIndex: number, focus?: FocusableElement | FocusableElement[]): boolean {
  if (Array.isArray(focus)) {
    return focus.some(focus => isItemFocus(itemType, itemIndex, focus))
  }
  return isMaterialFocus(focus) && focus.type === itemType && focus.getIndexes().includes(itemIndex)
}

export function isMaterialFocus(focus?: FocusableElement): focus is Material {
  return typeof focus === 'object' && (focus as Material).entries !== undefined
}

export function countTutorialFocusRefs(focus?: FocusableElement | FocusableElement[]): number {
  if (!focus) return 0
  if (Array.isArray(focus)) {
    return sumBy(focus, focus => countTutorialFocusRefs(focus))
  }
  if (isMaterialFocus(focus)) {
    return sumBy(focus.getItems(), item => item.quantity ?? 1)
  } else if (isStaticItem(focus)) {
    return focus.item.quantity ?? 1
  } else if (isLocationBuilder(focus)) {
    return 1
  } else {
    return 0
  }
}

export function isStaticItem(focus?: FocusableElement): focus is StaticItem {
  return typeof focus === 'object' && typeof (focus as any).type === 'number' && typeof (focus as any).item === 'object'
}

export function isStaticItemFocus(itemType: number, item: MaterialItem, focus?: FocusableElement | FocusableElement[]): boolean {
  if (Array.isArray(focus)) {
    return focus.some(focus => isStaticItemFocus(itemType, item, focus))
  }
  return isStaticItem(focus) && focus.type === itemType && equal(focus.item, item)
}

export function isLocationBuilder(focus?: FocusableElement): focus is LocationBuilder {
  return typeof focus === 'object' && typeof (focus as LocationBuilder).location === 'object'
}

export function isLocationFocus(location: Location, focus?: FocusableElement | FocusableElement[]): boolean {
  if (Array.isArray(focus)) {
    return focus.some(focus => isLocationFocus(location, focus))
  }
  return isLocationBuilder(focus) && equal(focus.location, location)
}