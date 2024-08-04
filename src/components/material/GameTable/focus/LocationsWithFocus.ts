import { Location, MaterialItem } from '@gamepark/rules-api'
import isEqual from 'lodash/isEqual'
import { ItemContext, Locator, LocationContext } from '../../../../locators'
import { MaterialFocus } from './MaterialFocus'

export type LocationsWithFocus = {
  locations: Location[]
  focusedIndexes: number[]
}

const getFocusedLocations = (locationsFocus: Location[], locations: Location[]) => {
  const focusedIndexes = []
  for (const locationFocus of locationsFocus) {
    const index = locations.findIndex(location => isEqual(location, locationFocus))
    if (index !== -1) {
      focusedIndexes.push(index)
    } else {
      focusedIndexes.push(locations.length)
      locations.push(locationFocus)
    }
  }
  return { locations, focusedIndexes }
}

export const getLocationsWithFocus = (
  item: MaterialItem, context: ItemContext, focus?: MaterialFocus
): LocationsWithFocus => {
  const locationsFocus = focus?.locations?.filter(location =>
    context.locators[location.type]?.parentItemType === context.type && (location.parent ?? 0) === context.index
  ) ?? []
  const locations = context.material[context.type]?.getLocations(item, context) ?? []
  return getFocusedLocations(locationsFocus, locations)
}

export const getStaticLocationsWithFocus = (
  context: LocationContext, focus?: MaterialFocus
): Location[] => {
  return Object.keys(context.locators).flatMap((type) => {
    const locator = context.locators[type] as Locator
    if (locator.parentItemType !== undefined) return []
    const locationsFocus = focus?.locations.filter(l => l.type === +type) ?? []
    const locations = locator.getLocations(context)
    return getFocusedLocations(locationsFocus, locations).locations
  })

}

