import { DisplayedItem } from '@gamepark/rules-api'
import { useContext } from 'react'
import { DraggedItemContext } from '../components/material/GameTable/DraggedItemProvider'

export function useDraggedItem<M extends number = number>(): DisplayedItem<M> | undefined {
  return useContext(DraggedItemContext) as DisplayedItem<M> | undefined
}
