import { Location, MaterialItem } from '@gamepark/rules-api'
import equal from 'fast-deep-equal'
import { ItemContext } from '../../../../locators'
import { FocusableElement, isLocationBuilder } from './FocusableElement'

export type FocusableLocation = {
  location: Location
  focus?: true
}

export const getLocationsWithFocus = (
  item: MaterialItem, context: ItemContext, focus?: FocusableElement | FocusableElement[]
): [Location[], number[]] => {
  const locationsFocus = getLocationsFocus(focus).filter(location =>
    context.locators[location.type]?.parentItemType === context.type && (location.parent ?? 0) === context.index
  )
  const result: [Location[], number[]] = [context.material[context.type]?.getLocations(item, context) ?? [], []]
  for (const locationFocus of locationsFocus) {
    const index = result[0].findIndex(location => equal(location, locationFocus))
    if (index !== -1) {
      result[1].push(index)
    } else {
      result[1].push(result[0].length)
      result[0].push(locationFocus)
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