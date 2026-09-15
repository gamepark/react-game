import { useDndContext } from '@dnd-kit/core'
import { DisplayedItem } from '@gamepark/rules-api'
import { createContext, ReactNode } from 'react'
import { dataIsDisplayedItem } from '../DraggableMaterial'

export const DraggedItemContext = createContext<DisplayedItem | undefined>(undefined)

/**
 * Provides the item being dragged, derived from dnd-kit's reactive state instead of its drag events.
 *
 * dnd-kit (6.3.1) only delivers onDragEnd / onDragCancel, to the DndContext props as well as to the useDndMonitor
 * listeners, once its internal sensor context holds the active draggable. That context is refreshed in a layout effect,
 * after the render that follows onDragStart. If the pointer is released before that render is committed (a quick flick,
 * or a slow device), the drag ends silently: onDragStart was delivered but no end event ever comes, and any state
 * toggled by those events stays "dragging" forever (drop areas like a large "recycle" zone, panning lock...).
 * `active` on the other hand is always reset by dnd-kit's reducer, so it is the reliable source of truth.
 *
 * useDndContext changes on every drag move, but only this provider consumes it: its own consumers are re-rendered
 * only when the dragged item changes, because the draggable data keeps its identity during the whole drag.
 */
export const DraggedItemProvider = ({ children }: { children?: ReactNode }) => {
  const data = useDndContext().active?.data.current
  return <DraggedItemContext.Provider value={dataIsDisplayedItem(data) ? data : undefined}>{children}</DraggedItemContext.Provider>
}
