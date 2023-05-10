/** @jsxImportSource @emotion/react */
import { Attributes, Children, Fragment, ReactNode } from 'react'
import { DraggableProps } from '../Draggable'
import { DraggableHandItem } from './DraggableHandItem'
import { HandItem, HandItemProps } from './HandItem'

export type HandProps<DragObject = any, DropResult = any> = {
  maxAngle?: number // The maximum angle in degrees there can be between the 2 most extreme cards
  gapMaxAngle?: number // The maximum angle between 2 adjacent cards
  clockwise?: boolean // Which way the cards are displayed. Default to true.
  getItemProps?: (index: number) => ItemProps<DragObject, DropResult>
} & ItemProps<DragObject, DropResult>

export type ItemProps<DragObject, DropResult> = {
  ignore?: boolean
  drag?: DraggableProps<DragObject, DropResult>
} & Omit<HandItemProps, 'angle'>

export const Hand = <DragObject, DropResult>(
  { children, maxAngle = 15, gapMaxAngle = 3, clockwise = true, getItemProps, ...props }: HandProps<DragObject, DropResult>
) => {
  const items = Children.toArray(children).filter(child => !!child)
  const itemsProps = items.map((_, index) => getItemProps?.(index) ?? {})
  const totalItems = itemsProps.filter(itemProps => !itemProps?.ignore).length
  const nearbyRotation = items.length > 1 ? Math.min(maxAngle / (items.length - 1), gapMaxAngle) * (clockwise ? 1 : -1) : 0
  const handItems = []
  let previousItems = 0
  for (let index = 0; index < items.length; index++) {
    const { ignore, ...itemProps } = itemsProps[index]
    const angle = ignore ? 0 : (previousItems - (totalItems - 1) / 2) * nearbyRotation
    const child = items[index]
    const key = hasKey(child) ? child.key : index
    if (itemProps?.drag) {
      handItems.push(
        <DraggableHandItem key={key} angle={angle} drag={itemProps?.drag} {...props} {...itemProps}>
          {child}
        </DraggableHandItem>
      )
    } else {
      handItems.push(
        <HandItem key={key} angle={angle} {...props} {...itemProps}>
          {child}
        </HandItem>
      )
    }
    if (!ignore) {
      previousItems++
    }
  }
  return <Fragment>{handItems}</Fragment>
}

const hasKey = (child: ReactNode): child is ReactNode & Attributes => (child as Attributes).key != undefined