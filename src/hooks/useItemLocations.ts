import { Location, MaterialItem } from '@gamepark/rules-api'
import isEqual from 'lodash/isEqual'
import { useFocusContext } from '../components'
import { ItemContext } from '../locators'

export type LocationFocusRef<P extends number = number, L extends number = number> = {
  location: Location<P, L>
  focusRef?: (ref: HTMLElement | null) => void
}

export function useItemLocations<P extends number = number, M extends number = number, L extends number = number>(
  item: MaterialItem<P, L>, context: ItemContext<P, M, L>
): LocationFocusRef<P, L>[] {
  const { index, type, locators, material } = context
  const { focus, focusRef } = useFocusContext<P, M, L>()
  if (!item) return []
  const locationsFocus = focus?.locations?.filter(location =>
    locators[location.type]?.parentItemType === type && (location.parent ?? 0) === index
  ) ?? []
  const locations = material[type]?.getLocations(item, context) ?? []
  const result: LocationFocusRef<P, L>[] = locations.map(location => ({ location }))

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
