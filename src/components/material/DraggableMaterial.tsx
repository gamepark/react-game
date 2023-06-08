/** @jsxImportSource @emotion/react */
import { FC, useContext, useEffect, useRef, useState } from 'react'
import { DeleteItem, DisplayedItem, isDeleteItem, isMoveItem, MaterialItem, MaterialRules, MoveItem } from '@gamepark/rules-api'
import { MaterialComponent, MaterialComponentProps } from './MaterialComponent'
import { grabbingCursor, grabCursor, pointerCursorCss, shineEffect, transformCss } from '../../css'
import { useDraggable } from '@dnd-kit/core'
import { css } from '@emotion/react'
import { combineEventListeners } from '../../utilities'
import { useAnimation, useMaterialAnimations, usePlayerId, useRules } from '../../hooks'
import { useScale } from '../../hooks/useScale'
import { gameContext, MaterialGameContext } from '../GameProvider'
import { ItemAnimationContext } from './MaterialAnimations'

export type DraggableMaterialProps<P extends number = number, M extends number = number, L extends number = number> = {
  item: MaterialItem<P, L>
  index: number
  displayIndex: number
  disabled?: boolean
  preTransform?: string
  postTransform?: string
} & MaterialComponentProps<number, P, M, L>

export const DraggableMaterial: FC<DraggableMaterialProps> = ({ item, type, index, displayIndex, disabled, preTransform, postTransform, ...props }) => {

  const displayedItem: DisplayedItem = { type, index, displayIndex }
  const { attributes, listeners, transform, setNodeRef } = useDraggable({
    id: `${type}_${index}_${displayIndex}`,
    data: displayedItem,
    disabled
  })

  const scale = useScale()
  const transformRef = useRef<string>()
  if (transform) {
    const { x, y } = transform
    transformRef.current = `translate3d(${Math.round(x / scale)}px, ${y ? Math.round(y / scale) : 0}px, 20em)`
  }

  const materialAnimations = useMaterialAnimations(type)
  const context = useContext(gameContext) as MaterialGameContext
  const rules = useRules<MaterialRules>()!
  const player = usePlayerId()
  const animation = useAnimation<MoveItem | DeleteItem>(animation =>
    (isMoveItem(animation.move, type) || isDeleteItem(animation.move, type))
    && animation.move.itemIndex === index
  )
  const locator = context.locators[item.location.type]
  const animationContext: ItemAnimationContext = { ...context, rules, player }
  const animationCss = !!animation
    && locator.isItemToAnimate(displayedItem, animation, animationContext)
    && materialAnimations?.getItemAnimation(item, animation, animationContext)

  // We need to delay a little the default transition removal when dragging starts, otherwise dnd-kit suffers from transform side effect
  // because we opted out from ignoring transform in the configuration (using: "draggable: { measure: getClientRect }")
  const [applyTransform, setApplyTransform] = useState(false)
  useEffect(() => {
    const timeout = setTimeout(() => setApplyTransform(transform !== null))
    return () => clearTimeout(timeout)
  }, [transform !== null])

  return (
    <MaterialComponent ref={setNodeRef} type={type} itemId={item.id}
                       css={[
                         !applyTransform && transformTransition(animation?.duration),
                         !disabled && noTouchAction,
                         disabled || animation ? pointerCursorCss : transform ? grabbingCursor : [shineEffect, grabCursor],
                         transformCss(preTransform, applyTransform && transformRef.current, postTransform),
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

export function isDraggedItem<M extends number = number>(data?: Record<string, any>): data is DisplayedItem<M> {
  return typeof data?.type === 'number' && typeof data?.index === 'number' && typeof data?.displayIndex === 'number'
}
