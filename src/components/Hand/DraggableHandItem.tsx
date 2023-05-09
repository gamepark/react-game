/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useEffect } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { DragAround, DraggableProps, endWithDrop } from '../Draggable'
import { HandItem, HandItemProps } from './HandItem'
import { grabCursor } from '../../css'

export type DraggableHandItemProps<DragObject, DropResult> = HandItemProps
  & { drag: DraggableProps<DragObject, DropResult> }

export const DraggableHandItem = <DragObject, DropResult>(
  {
    children,
    drag: { type, item, options, previewOptions, end, canDrag, isDragging, drop, ...draggableProps },
    css,
    ...props
  }: DraggableHandItemProps<DragObject, DropResult>
) => {
  const [{ draggable, dragging }, ref, preview] = useDrag({
    type, item, options, previewOptions, end: endWithDrop(end, drop), canDrag, isDragging,
    collect: monitor => ({ draggable: monitor.canDrag(), dragging: monitor.isDragging() })
  })
  useEffect(() => {
    preview(getEmptyImage())
  }, [])
  return (
    <HandItem ref={ref} itemSelector="> * > * > *" css={[css, draggable && grabCursor, dragging && draggingStyle]} {...props}>
      <DragAround dragging={dragging} css={fullSize} {...draggableProps}>
        {children}
      </DragAround>
    </HandItem>
  )
}

const draggingStyle = css`z-index: 1000;`

const fullSize = css`
  height: 100%;
  width: 100%;
`
