/** @jsxImportSource @emotion/react */
import { FC, useContext, useEffect, useState } from 'react'
import { DeleteItem, isDeleteItem, isMoveItem, MaterialItem, MoveItem } from '@gamepark/rules-api'
import { MaterialComponent, MaterialComponentProps } from './MaterialComponent'
import { grabbingCursor, grabCursor, pointerCursorCss, shineEffect, transformCss } from '../../css'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { css } from '@emotion/react'
import { gameContext } from '../GameProvider'
import { combineEventListeners } from '../../utilities'
import { useAnimation } from '../../hooks'

export type DraggableMaterialProps<P extends number = number, M extends number = number, L extends number = number> = {
  id: string
  data: DraggableItemData<P, M, L>
  disabled?: boolean
  preTransform?: string
  postTransform?: string
} & MaterialComponentProps<number, P, M, L>

export type DraggableItemData<P extends number = number, M extends number = number, L extends number = number> = {
  item: MaterialItem<P, L>
  type: M
  index: number
}

export function isDraggableItemData<P extends number = number, M extends number = number, L extends number = number>(
  data?: Record<string, any>
): data is DraggableItemData<P, M, L> {
  return typeof data?.item === 'object' && typeof data?.type === 'number' && typeof data?.index === 'number'
}

export type DragMaterialItem<Player extends number = number, MaterialType extends number = number, LocationType extends number = number> = {
  item: MaterialItem<Player, LocationType>
  type: MaterialType
  index: number
}

export const DraggableMaterial: FC<DraggableMaterialProps> = ({ id, data, disabled, preTransform, postTransform, ...props }) => {

  const { attributes, listeners, transform, isDragging, setNodeRef } = useDraggable({ id, data, disabled })

  const scale = useContext(gameContext).scale ?? 1
  const draggingTranslate = CSS.Translate.toString(transform && { ...transform, x: transform.x / scale, y: transform.y / scale })

  const animation = useAnimation<MoveItem | DeleteItem>(animation =>
    (isMoveItem(animation.move, data.type) || isDeleteItem(animation.move, data.type))
    && animation.move.itemIndex === data.index
  )

  // We need to delay a little the default transition removal when dragging starts, otherwise dnd-kit suffers from transform side effect
  // because we opted out from ignoring transform in the configuration (using: "draggable: { measure: getClientRect }")
  const [isAlreadyDragging, setIsAlreadyDragging] = useState(false)
  useEffect(() => {
    if (isDragging) {
      const timeout = setTimeout(() => setIsAlreadyDragging(true))
      return () => clearTimeout(timeout)
    } else {
      setIsAlreadyDragging(false)
    }
  }, [isDragging])

  return (
    <MaterialComponent ref={setNodeRef} itemId={data.item.id}
                       css={[
                         !(isAlreadyDragging && draggingTranslate) && transformTransition(animation?.duration),
                         !disabled && noTouchAction,
                         disabled ? pointerCursorCss : isDragging ? grabbingCursor : [shineEffect, grabCursor],
                         transformCss(preTransform, draggingTranslate, postTransform)
                       ]}
                       {...props} {...attributes} {...combineEventListeners(listeners ?? {}, props)}/>
  )
}

const noTouchAction = css`
  touch-action: none;
`

const transformTransition = (duration: number = 0.2) => css`
  transition: transform ${duration}s ease-in-out
`
