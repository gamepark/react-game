/** @jsxImportSource @emotion/react */
import { FC, useContext, useEffect, useState } from 'react'
import { MaterialItem } from '@gamepark/rules-api'
import { MaterialComponent, MaterialComponentProps } from './MaterialComponent'
import { grabbingCursor, grabCursor, pointerCursorCss, shineEffect, transformCss } from '../../css'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { css } from '@emotion/react'
import { gameContext } from '../../../../workshop/packages/react-client'

export type DraggableMaterialProps<P extends number = number, M extends number = number, L extends number = number> = {
  id: string
  data: DraggableItemData<P, M, L>
  disabled?: boolean
  preTransform?: string
  postTransform?: string
} & MaterialComponentProps<number, P, M, L>

type DraggableItemData<P extends number = number, M extends number = number, L extends number = number> = {
  item: MaterialItem<P, L>
  type: M
  index: number
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
                         !isAlreadyDragging && defaultTransition,
                         !disabled && noTouchAction,
                         disabled ? pointerCursorCss : isDragging ? grabbingCursor : [shineEffect, grabCursor],
                         transformCss(preTransform, draggingTranslate, postTransform)
                       ]}
                       {...listeners} {...attributes} {...props}/>
  )
}

const noTouchAction = css`
  touch-action: none;
`

const defaultTransition = css`
  transition: transform 0.2s ease-in-out
`
