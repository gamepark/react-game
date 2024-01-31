import { Location, MaterialItem } from '@gamepark/rules-api'
import equal from 'fast-deep-equal'
import { ItemContext } from '../../../../locators'
import { MaterialFocus } from './MaterialFocus'

export type LocationsWithFocus = {
  locations: Location[]
  focusedIndexes: number[]
}

export const getLocationsWithFocus = (
  item: MaterialItem, context: ItemContext, focus?: MaterialFocus
): LocationsWithFocus => {
  const locationsFocus = focus?.locations?.filter(location =>
    context.locators[location.type]?.parentItemType === context.type && (location.parent ?? 0) === context.index
  ) ?? []
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
