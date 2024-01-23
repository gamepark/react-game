import { Location, MaterialItem } from '@gamepark/rules-api'
import equal from 'fast-deep-equal'
import { ItemContext } from '../../../../locators'
import { FocusableElement, isLocationBuilder } from './FocusableElement'

export type LocationsWithFocus = {
  locations: Location[]
  focusedIndexes: number[]
}

export const getLocationsWithFocus = (
  item: MaterialItem, context: ItemContext, focus?: FocusableElement | FocusableElement[]
): LocationsWithFocus => {
  const locationsFocus = getLocationsFocus(focus).filter(location =>
    context.locators[location.type]?.parentItemType === context.type && (location.parent ?? 0) === context.index
  )
  const locations = context.material[context.type]?.getLocations(item, context) ?? []
  const focusedIndexes = []
  for (const locationFocus of locationsFocus) {
    const index = locations.findIndex(location => equal(location, locationFocus))
    if (index !== -1) {
      focusedIndexes.push(index)
    } else {
      focusedIndexes.push(locations.length)
      locations.push(locationFocus)
    }
  }
  return { locations, focusedIndexes }
}

const getLocationsFocus = (focus?: FocusableElement | FocusableElement[]): Location[] => {
  if (!focus) return []
  if (Array.isArray(focus)) {
    return focus.filter(isLocationBuilder).map(builder => builder.location)
  }
  return isLocationBuilder(focus) ? [focus.location] : []
}