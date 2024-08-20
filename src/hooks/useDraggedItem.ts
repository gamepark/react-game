import { DragStartEvent, useDndMonitor } from '@dnd-kit/core'
import { DisplayedItem } from '@gamepark/rules-api'
import { useCallback, useState } from 'react'
import { dataIsDisplayedItem } from '../components/material/DraggableMaterial'

export function useDraggedItem<M extends number = number>(): DisplayedItem<M> | undefined {
  const [draggedItem, setDraggedItem] = useState<DisplayedItem<M>>()
  const onDragStart = useCallback((event: DragStartEvent) => {
    if (dataIsDisplayedItem<M>(event.active.data.current)) {
      setDraggedItem(event.active.data.current)
    }
  }, [])
  const onDragEnd = useCallback(() => setDraggedItem(undefined), [])
  useDndMonitor({ onDragStart, onDragEnd })
  return draggedItem
}