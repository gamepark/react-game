/** @jsxImportSource @emotion/react */
import { forwardRef, useContext, useEffect, useRef, useState } from 'react'
import { DisplayedItem, isCreateItem, isDeleteItem, isMoveItem, ItemMove, itemsCanMerge, MaterialItem, MaterialMove, MaterialRules } from '@gamepark/rules-api'
import { MaterialComponent, MaterialComponentProps } from './MaterialComponent'
import { grabbingCursor, grabCursor, pointerCursorCss, transformCss } from '../../css'
import { useDraggable } from '@dnd-kit/core'
import { css } from '@emotion/react'
import { combineEventListeners } from '../../utilities'
import { useAnimation, useAnimations, useMaterialAnimations, usePlayerId, useRules } from '../../hooks'
import { useScale } from '../../hooks/useScale'
import { gameContext, MaterialGameContext } from '../GameProvider'
import { ItemAnimationContext } from './MaterialAnimations'
import merge from 'lodash/merge'
import equal from 'fast-deep-equal'
import { mergeRefs } from 'react-merge-refs'

export type DraggableMaterialProps<P extends number = number, M extends number = number, L extends number = number> = {
  item: MaterialItem<P, L>
  index: number
  displayIndex: number
  disabled?: boolean
  preTransform?: string
  postTransform?: string
} & MaterialComponentProps<number, P, M, L>

export const DraggableMaterial = forwardRef<HTMLDivElement, DraggableMaterialProps>((
  { item, type, index, displayIndex, disabled, preTransform, postTransform, ...props }, ref
) => {

  const displayedItem: DisplayedItem = { type, index, displayIndex }
  const { attributes, listeners, transform, setNodeRef } = useDraggable({
    id: `${type}_${index}_${displayIndex}`,
    data: displayedItem,
    disabled
  })

  // We need to delay a little the default transition removal when dragging starts, otherwise dnd-kit suffers from transform side effect
  // because we opted out from ignoring transform in the configuration (using: "draggable: { measure: getClientRect }")
  const [ignoreTransform, setIgnoreTransform] = useState(true)
  useEffect(() => {
    if (transform !== null) {
      const timeout = setTimeout(() => setIgnoreTransform(false))
      return () => clearTimeout(timeout)
    } else {
      setIgnoreTransform(true)
    }
  }, [transform !== null])

  const scale = useScale()
  const transformRef = useRef<string>()
  if (transform && !ignoreTransform) {
    const { x, y } = transform
    transformRef.current = `translate3d(${Math.round(x / scale)}px, ${y ? Math.round(y / scale) : 0}px, 20em)`
  }

  const materialAnimations = useMaterialAnimations(type)
  const context = useContext(gameContext) as MaterialGameContext
  const rules = useRules<MaterialRules>()!
  const player = usePlayerId()
  const animations = useAnimations<MaterialMove>(animation => animation.action.playerId === player)
  const animation = useAnimation<ItemMove>(animation =>
    (isCreateItem(animation.move, type) && itemsCanMerge(item, animation.move.item))
    || (isMoveItem(animation.move, type) && animation.move.itemIndex === index)
    || (isDeleteItem(animation.move, type) && animation.move.itemIndex === index)
  )
  const locator = context.locators[item.location.type]
  const animationContext: ItemAnimationContext = { ...context, rules, player }
  const isItemToAnimate = !!animation && locator.isItemToAnimate(displayedItem, animation, animationContext)
  const animationCss = isItemToAnimate && materialAnimations?.getItemAnimation(displayedItem, animation, animationContext)
  const isDroppedItem = equal(rules.game.droppedItem, displayedItem)
  const applyTransform = isDroppedItem || !ignoreTransform

  if (isItemToAnimate && isMoveItem(animation.move) && typeof animation.move.reveal === 'object') {
    item = JSON.parse(JSON.stringify(item))
    merge(item, animation.move.reveal)
  }

  return (
    <MaterialComponent ref={mergeRefs([ref, setNodeRef])} type={type} itemId={item.id}
                       css={[
                         !applyTransform && transformTransition(animation?.duration),
                         !disabled && noTouchAction,
                         disabled || animations.length ? pointerCursorCss : transform ? grabbingCursor : grabCursor,
                         transformCss(preTransform, applyTransform && transformRef.current, postTransform),
                         animationCss
                       ]}
                       highlight={!disabled && !animations.length && !transform}
                       {...props} {...attributes} {...combineEventListeners(listeners ?? {}, props)}/>
  )
})

const noTouchAction = css`
  touch-action: none;
`

const transformTransition = (duration: number = 0.2) => css`
  transition: transform ${duration}s ease-in-out
`

export function isDraggedItem<M extends number = number>(data?: Record<string, any>): data is DisplayedItem<M> {
  return typeof data?.type === 'number' && typeof data?.index === 'number' && typeof data?.displayIndex === 'number'
}
