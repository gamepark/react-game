/** @jsxImportSource @emotion/react */
import { FC, useContext, useEffect, useState } from 'react'
import { DeleteItem, isDeleteItem, isMoveItem, MaterialGame, MaterialItem, MoveItem } from '@gamepark/rules-api'
import { MaterialComponent, MaterialComponentProps } from './MaterialComponent'
import { grabbingCursor, grabCursor, pointerCursorCss, shineEffect, transformCss } from '../../css'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { css } from '@emotion/react'
import { combineEventListeners } from '../../utilities'
import { useAnimation, useGame, useMaterialAnimations } from '../../hooks'
import { useScale } from '../../hooks/useScale'
import { gameContext, MaterialGameContext } from '../GameProvider'
import { ItemAnimationContext } from './MaterialAnimations'

export type DraggableMaterialProps<P extends number = number, M extends number = number, L extends number = number> = {
  item: MaterialItem<P, L>
  itemIndex: number
  index: number
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

export const DraggableMaterial: FC<DraggableMaterialProps> = ({ item, type, itemIndex, index, disabled, preTransform, postTransform, ...props }) => {

  const { attributes, listeners, transform, isDragging, setNodeRef } = useDraggable({
    id: `${type}_${itemIndex}_${index}`,
    data: { item, type, index: itemIndex },
    disabled
  })

  const scale = useScale()
  const draggingTranslate = CSS.Translate.toString(transform && { ...transform, x: transform.x / scale, y: transform.y / scale })

  const materialAnimations = useMaterialAnimations(type)
  const context = useContext(gameContext) as MaterialGameContext
  const game = useGame<MaterialGame>()!
  const animation = useAnimation<MoveItem | DeleteItem>(animation =>
    (isMoveItem(animation.move, type) || isDeleteItem(animation.move, type))
    && animation.move.itemIndex === itemIndex
  )
  const locator = context.locators[item.location.type]
  const animationContext: ItemAnimationContext = { ...context, index, game }
  const animationCss = !!animation
    && locator.isItemToAnimate(item, animation, animationContext)
    && materialAnimations?.getItemAnimation(item, animation, animationContext)

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
    <MaterialComponent ref={setNodeRef} type={type} itemId={item.id}
                       css={[
                         !(isAlreadyDragging && draggingTranslate) && transformTransition(animation?.duration),
                         !disabled && noTouchAction,
                         disabled || animation ? pointerCursorCss : isDragging ? grabbingCursor : [shineEffect, grabCursor],
                         transformCss(preTransform, draggingTranslate, draggingTranslate && 'translateZ(20em)', postTransform),
                         animationCss
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
