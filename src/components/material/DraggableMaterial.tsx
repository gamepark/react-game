/** @jsxImportSource @emotion/react */
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DisplayedItem, isCreateItem, isDeleteItem, isMoveItem, ItemMove, itemsCanMerge, MaterialItem, MaterialMove } from '@gamepark/rules-api'
import { MaterialComponent, MaterialComponentProps } from './MaterialComponent'
import { grabbingCursor, grabCursor, pointerCursorCss, transformCss } from '../../css'
import { DragStartEvent, useDndMonitor, useDraggable } from '@dnd-kit/core'
import { css } from '@emotion/react'
import { combineEventListeners } from '../../utilities'
import { useAnimation, useAnimations, useLegalMoves, useMaterialAnimations, useMaterialContext } from '../../hooks'
import merge from 'lodash/merge'
import equal from 'fast-deep-equal'
import { mergeRefs } from 'react-merge-refs'
import { useTransformContext } from 'react-zoom-pan-pinch'
import { ItemContext } from '../../locators'

export type DraggableMaterialProps<P extends number = number, M extends number = number, L extends number = number> = {
  item: MaterialItem<P, L>
  index: number
  displayIndex: number
  disabled?: boolean
  preTransform?: string
  postTransform?: string
} & MaterialComponentProps<M>

export const DraggableMaterial = forwardRef<HTMLDivElement, DraggableMaterialProps>((
  { highlight, item, type, index, displayIndex, disabled, preTransform, postTransform, ...props }, ref
) => {

  const displayedItem: DisplayedItem = useMemo(() => ({ type, index, displayIndex }), [type, index, displayIndex])
  const { attributes, listeners, transform, setNodeRef } = useDraggable({
    id: `${type}_${index}_${displayIndex}`,
    data: displayedItem,
    disabled
  })

  // We need to delay a little the default transition removal when dragging starts, otherwise dnd-kit suffers from transform side effect
  // because we opted out from ignoring transform in the configuration (using: "draggable: { measure: getClientRect }")
  const [ignoreTransform, setIgnoreTransform] = useState(true)
  const [smoothReturn, setSmoothReturn] = useState(false)
  useEffect(() => {
    if (transform !== null) {
      setSmoothReturn(true)
      const timeout = setTimeout(() => setIgnoreTransform(false))
      return () => clearTimeout(timeout)
    } else {
      setIgnoreTransform(true)
    }
  }, [transform !== null])

  const transformContext = useTransformContext()
  const transformRef = useRef<string>()
  if (transform && !ignoreTransform) {
    const { x, y } = transform
    const scale = transformContext.transformState.scale
    transformRef.current = `translate3d(${Math.round(x / scale)}px, ${y ? Math.round(y / scale) : 0}px, 20em)`
  }

  const materialAnimations = useMaterialAnimations(type)
  const context = useMaterialContext()
  const animations = useAnimations<MaterialMove>(animation => animation.action.playerId === context.player)
  const animation = useAnimation<ItemMove>(animation =>
    (isCreateItem(animation.move, type) && itemsCanMerge(item, animation.move.item))
    || (isMoveItem(animation.move, type) && animation.move.itemIndex === index)
    || (isDeleteItem(animation.move, type) && animation.move.itemIndex === index)
  )
  const locator = context.locators[item.location.type]
  const itemContext: ItemContext = { ...context, ...displayedItem }
  const isItemToAnimate = !!animation && locator.isItemToAnimate(animation, itemContext)
  const animationCss = isItemToAnimate && materialAnimations?.getItemAnimation(itemContext, animation)
  const isDroppedItem = equal(context.game.droppedItem, displayedItem)
  const applyTransform = isDroppedItem || !ignoreTransform

  if (isItemToAnimate && isMoveItem(animation.move) && typeof animation.move.reveal === 'object') {
    item = JSON.parse(JSON.stringify(item))
    merge(item, animation.move.reveal)
  }

  // We have to disable the "smooth return transition" when we have an animation, because Firefox bugs when the animation is followed by a transition
  useEffect(() => {
    if (isItemToAnimate) {
      setSmoothReturn(false)
    }
  }, [isItemToAnimate])

  const legalMoves = useLegalMoves<MaterialMove>()
  const [isDragging, setIsDragging] = useState(false)
  const [canDropToSameLocation, setCanDropToSameLocation] = useState(false)

  const onDragStart = useCallback((event: DragStartEvent) => {
    setIsDragging(true)
    const dragged = event.active.data.current
    if (dataIsDisplayedItem(dragged)) {
      const locationDescription = locator.locationDescription
      const draggedItemDescription = context.material[dragged.type]
      if (locationDescription && legalMoves.some(move =>
        draggedItemDescription.canDrag(move, { ...context, ...dragged }) && locationDescription.canDrop(move, item.location, context)
      )) {
        setCanDropToSameLocation(true)
      }
    }
  }, [context, locator, legalMoves])

  const onDragEnd = useCallback(() => {
    setIsDragging(false)
    setCanDropToSameLocation(false)
  }, [])

  useDndMonitor({ onDragStart, onDragEnd })

  return (
    <div css={[animationWrapperCss, animationCss]}>
      <MaterialComponent ref={mergeRefs([ref, setNodeRef])} type={type} itemId={item.id}
                         css={[
                           !applyTransform && smoothReturn && transformTransition,
                           !disabled && noTouchAction,
                           disabled || animations.length ? pointerCursorCss : transform ? grabbingCursor : grabCursor,
                           transformCss(preTransform, applyTransform && transformRef.current, postTransform),
                           canDropToSameLocation && noPointerEvents
                         ]}
                         highlight={highlight ?? (!disabled && !animations.length && !isDragging)}
                         {...props} {...attributes} {...combineEventListeners(listeners ?? {}, props)}/>
    </div>
  )
})

const animationWrapperCss = css`
  transform-style: preserve-3d;

  > * {
    position: absolute;
  }
`

const noTouchAction = css`
  touch-action: none;
`

const noPointerEvents = css`
  pointer-events: none;
`

const transformTransition = css`
  transition: transform 0.2s ease-in-out
`

export function dataIsDisplayedItem<M extends number = number>(data?: Record<string, any>): data is DisplayedItem<M> {
  return typeof data?.type === 'number' && typeof data?.index === 'number' && typeof data?.displayIndex === 'number'
}
