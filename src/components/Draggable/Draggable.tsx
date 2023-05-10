/** @jsxImportSource @emotion/react */
import { useEffect } from 'react'
import { DragSourceOptions, useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { DragSourceHookSpec } from 'react-dnd/dist/types/hooks/types'
import { DragSourceMonitor } from 'react-dnd/dist/types/types'
import { DragAround, DragAroundProps } from './DragAround'
import { grabCursor } from '../../css'

type CollectedProps = {
  draggable: boolean
  dragging: boolean
}

export type DraggableProps<DragObject = any, DropResult = any> = Omit<DragAroundProps, 'dragging'>
  & Omit<DragSourceHookSpec<DragObject, DropResult, CollectedProps>, 'collect'>
  & {
  draggingChange?: (dragging: boolean) => void
  drop?: (dropResult: DropResult) => void
}

export const Draggable = <DragObject, DropResult>(
  { children, type, item, options, previewOptions, draggingChange, end, canDrag, isDragging, drop, css, ...props }: DraggableProps<DragObject, DropResult>
) => {
  const [{ draggable, dragging }, ref, preview] = useDrag({
    type, item, options, previewOptions, end: endWithDrop(end, drop), canDrag, isDragging,
    collect: monitor => ({ draggable: monitor.canDrag(), dragging: monitor.isDragging() })
  })
  useEffect(() => {
    preview(getEmptyImage())
  }, [])
  useEffect(() => {
    if (draggingChange) {
      draggingChange(dragging)
    }
  }, [dragging, draggingChange])
  return (
    <DragAround ref={ref} dragging={dragging} css={[css, draggable && grabCursor]} {...props}>
      {children}
    </DragAround>
  )
}

export const endWithDrop = <DragObject, DropResult>(
  end: DragSourceHookSpec<DragObject, DropResult, any>['end'],
  drop?: (dropResult: DropResult) => void
): DragSourceHookSpec<DragObject, DropResult, any>['end'] => (draggedItem: DragObject, monitor: DragSourceMonitor) => {
  if (end) {
    end(draggedItem, monitor)
  }
  if (drop && monitor.didDrop()) {
    const dropResult = monitor.getDropResult<DropResult>()
    if (dropResult) {
      drop(omitDropEffect(dropResult))
    }
  }
}

const omitDropEffect = <DropResult extends DragSourceOptions>(dropResult: DropResult): DropResult => {
  const { dropEffect, ...result } = dropResult
  return result as DropResult
}
