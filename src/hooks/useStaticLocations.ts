import isEqual from 'lodash/isEqual'
import { useFocusContext } from '../components'
import { Locator } from '../locators'
import { LocationFocusRef } from './useItemLocations'
import { useMaterialContext } from './useMaterialContext'

export function useStaticLocations<P extends number = number, M extends number = number, L extends number = number>(): LocationFocusRef<P, L>[] {
  const context = useMaterialContext<P, M, L>()
  const locators = context.locators
  const result: LocationFocusRef<P, L>[] = []
  for (const locator of Object.values(locators) as Locator<P, M, L>[]) {
    if (locator.parentItemType === undefined) {
      for (const location of locator.getLocations(context)) {
        result.push({ location })
      }
    }
  }
  const { focus, focusRef } = useFocusContext<P, M, L>()

  const locationsFocus = focus?.locations?.filter(location => locators[location.type]?.parentItemType === undefined) ?? []

  for (const location of locationsFocus) {
    const index = result.findIndex(r => isEqual(r.location, location))
    if (index !== -1) {
      result[index].focusRef = focusRef
    } else {
      result.push({ location, focusRef })
    }
  }
  return result
}
