import { DragStartEvent, useDndMonitor } from '@dnd-kit/core'
import { DisplayedItem, isDeleteItem, isMoveItem, Location, MaterialItem, MaterialMove } from '@gamepark/rules-api'
import isEqual from 'lodash/isEqual'
import { useCallback, useState } from 'react'
import { isLocationSubset, MaterialDescription, useFocusContext } from '../components'
import { dataIsDisplayedItem } from '../components/material/DraggableMaterial'
import { ItemContext, MaterialContext } from '../locators'
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

  const expectedDropLocations = useExpectedDropLocations<P, M, L>()
  for (const location of expectedDropLocations) {
    if (location.parent === index && locators[location.type]?.parentItemType === type && !result.some(r => isLocationSubset(location, r.location))) {
      result.push({ location })
    }
  }

  return result
}

export const useExpectedDropLocations = <P extends number = number, M extends number = number, L extends number = number>(): Location<P, L>[] => {
  const [draggedItem, setDraggedItem] = useState<DisplayedItem<M>>()
  const onDragStart = useCallback((event: DragStartEvent) => dataIsDisplayedItem<M>(event.active.data.current) && setDraggedItem(event.active.data.current), [])
  const onDragEnd = useCallback(() => setDraggedItem(undefined), [])
  useDndMonitor({ onDragStart, onDragEnd })
  const legalMoves = useLegalMoves<MaterialMove<P, M, L>>()
  const context = useMaterialContext<P, M, L>()
  if (!draggedItem) return []
  const locations: Location<P, L>[] = []
  for (const move of legalMoves) {
    const destination = getItemMoveDestination(draggedItem, move, context)
    if (destination && !locations.some(location => isEqual(location, destination))) {
      locations.push(destination)
    }
  }
  return locations
}

function getItemMoveDestination<P extends number = number, M extends number = number, L extends number = number>(
  { index, type }: DisplayedItem<M>, move: MaterialMove<P, M, L>, context: MaterialContext<P, M, L>
): Location<P, L> | undefined {
  if (isMoveItem(move) && move.itemType === type && move.itemIndex === index && move.location.type !== undefined) {
    return move.location as Location<P, L>
  } else if (isDeleteItem(move) && move.itemType === type && move.itemIndex === index) {
    const item = context.rules.material(type).getItem(index)
    const description = context.material[type] as MaterialDescription<P, M, L>
    return description?.getStockLocation(item, context)
  }
}
