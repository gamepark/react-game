import { Location, MaterialItem, MaterialMove } from '@gamepark/rules-api'
import { uniqWith } from 'lodash'
import isEqual from 'lodash/isEqual'
import { useMemo } from 'react'
import { useFocusContext } from '../components'
import { ItemContext, Locator, MaterialContext } from '../locators'
import { useDraggedItem } from './useDraggedItem'
import { useLegalMoves } from './useLegalMoves'
import { useMaterialContext } from './useMaterialContext'

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

  const locations = material[type]?.getLocations(item, context) ?? []
  for (const locationType in locators) {
    const locator = locators[locationType] as Locator<P, M, L>
    if (locator.parentItemType === type) {
      locations.push(...locator.getLocations(context))
    }
  }
  const result: LocationFocusRef<P, L>[] = locations.map(location => ({ location }))

  const locationsFocus = focus?.locations?.filter(location =>
    locators[location.type]?.parentItemType === type && (location.parent ?? 0) === index
  ) ?? []
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

export const useExpectedDropLocations = <P extends number = number, M extends number = number, L extends number = number>(): Location<P, L>[] => {
  const context: MaterialContext<P, M, L> & { expectedDropLocations?: Location<P, L>[] } = useMaterialContext<P, M, L>()
  const draggedItem = useDraggedItem<M>()
  const legalMoves = useLegalMoves<MaterialMove<P, M, L>>()
  return useMemo(() => {
    if (!draggedItem) {
      delete context.expectedDropLocations
    } else if (!context.expectedDropLocations) {
      const description = context.material[draggedItem.type]!
      const itemContext = { ...context, ...draggedItem }
      const dragMoves = legalMoves.filter(move => description.canDrag(move, itemContext))
      context.expectedDropLocations = uniqWith(description.getDropLocations(itemContext, dragMoves), isEqual)
    }
    return (context as any).expectedDropLocations ?? []
  }, [draggedItem])
}
