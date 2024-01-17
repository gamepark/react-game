import { Location, MaterialItem } from '@gamepark/rules-api'
import equal from 'fast-deep-equal'
import { ItemContext } from '../../../locators'
import { FocusableElement, isLocationBuilder } from './FocusableElement'

export type FocusableLocation = {
  location: Location
  focus?: true
}

export const getInnerLocations = (
  item: MaterialItem, context: ItemContext, focus?: FocusableElement | FocusableElement[]
): FocusableLocation[] => {
  const locationsFocus = getLocationsFocus(focus).filter(location =>
    context.locators[location.type]?.parentItemType === context.type && (location.parent ?? 0) === context.index
  )
  const result: FocusableLocation[] = context.material[context.type]?.getLocations(item, context).map(location => ({ location })) ?? []
  for (const locationFocus of locationsFocus) {
    const focusableLocation = result.find(focusableLocation => equal(focusableLocation.location, locationFocus))
    if (focusableLocation) {
      focusableLocation.focus = true
    } else {
      result.push({ location: locationFocus, focus: true })
    }
  }
  return result
}

const getLocationsFocus = (focus?: FocusableElement | FocusableElement[]): Location[] => {
  if (!focus) return []
  if (Array.isArray(focus)) {
    return focus.filter(isLocationBuilder).map(builder => builder.location)
  }
  return isLocationBuilder(focus) ? [focus.location] : []
}