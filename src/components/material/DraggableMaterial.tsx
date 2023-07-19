/** @jsxImportSource @emotion/react */
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DisplayedItem, isCreateItem, isDeleteItem, isMoveItem, ItemMove, itemsCanMerge, MaterialItem, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { MaterialComponent, MaterialComponentProps } from './MaterialComponent'
import { grabbingCursor, grabCursor, pointerCursorCss, transformCss } from '../../css'
import { DragMoveEvent, DragStartEvent, useDndMonitor, useDraggable } from '@dnd-kit/core'
import { css } from '@emotion/react'
import { combineEventListeners } from '../../utilities'
import { useAnimation, useAnimations, useLegalMoves, useMaterialAnimations, useMaterialContext } from '../../hooks'
import merge from 'lodash/merge'
import equal from 'fast-deep-equal'
import { mergeRefs } from 'react-merge-refs'
import { useTransformContext } from 'react-zoom-pan-pinch'
import { ItemContext, MaterialContext } from '../../locators'

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
  const { attributes, listeners, transform: selfTransform, setNodeRef } = useDraggable({
    id: `${type}_${index}_${displayIndex}`,
    data: displayedItem,
    disabled
  })

  const [draggedItem, setDraggedItem] = useState<DisplayedItem>()
  const context = useMaterialContext()
  const { game: { droppedItem }, player, locators, material } = context
  const isDraggingParent = useMemo(() => !!draggedItem && isPlacedOnItem(item, draggedItem, context), [item, draggedItem, context])
  const legalMoves = useLegalMoves<MaterialMove>()
  const canDropToSameLocation = useMemo(() => {
    if (!draggedItem) return false
    const location = locators[item.location.type].locationDescription
    if (!location) return false
    const description = material[draggedItem.type]
    const itemContext = { ...context, ...draggedItem }
    return legalMoves.some(move => description.canDrag(move, itemContext) && location.canDrop(move, item.location, context))
  }, [item, draggedItem, context, legalMoves])

  const [parentTransform, setParentTransform] = useState<XYCoordinates>()
  const transform = selfTransform ?? parentTransform

  // We need to delay a little the default transition removal when dragging starts, otherwise dnd-kit suffers from transform side effect
  // because we opted out from ignoring transform in the configuration (using: "draggable: { measure: getClientRect }")
  const [ignoreTransform, setIgnoreTransform] = useState(true)
  const [smoothReturn, setSmoothReturn] = useState(false)
  useEffect(() => {
    if (transform) {
      setSmoothReturn(true)
      const timeout = setTimeout(() => setIgnoreTransform(false))
      return () => clearTimeout(timeout)
    } else {
      setIgnoreTransform(true)
    }
  }, [!transform])

  const transformContext = useTransformContext()
  const transformRef = useRef<string>()
  if (transform && !ignoreTransform) {
    const { x, y } = transform
    const scale = transformContext.transformState.scale
    transformRef.current = `translate3d(${Math.round(x / scale)}px, ${y ? Math.round(y / scale) : 0}px, 20em)`
  }

  const materialAnimations = useMaterialAnimations(type)
  const animations = useAnimations<MaterialMove>(animation => animation.action.playerId === player)
  const animation = useAnimation<ItemMove>(animation =>
    (isCreateItem(animation.move, type) && itemsCanMerge(item, animation.move.item))
    || (isMoveItem(animation.move, type) && animation.move.itemIndex === index)
    || (isDeleteItem(animation.move, type) && animation.move.itemIndex === index)
  )
  const locator = locators[item.location.type]
  const itemContext: ItemContext = { ...context, ...displayedItem }
  const isItemToAnimate = !!animation && locator.isItemToAnimate(animation, itemContext)
  const animationCss = isItemToAnimate && materialAnimations?.getItemAnimation(itemContext, animation)
  const isDroppedItem = droppedItem !== undefined && (equal(droppedItem, displayedItem) || isPlacedOnItem(item, droppedItem, context))
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

  const onDragStart = useCallback((event: DragStartEvent) => dataIsDisplayedItem(event.active.data.current) && setDraggedItem(event.active.data.current), [])
  const onDragMove = useCallback((event: DragMoveEvent) => isDraggingParent && setParentTransform(event.delta), [isDraggingParent])
  const onDragEnd = useCallback(() => {
    setDraggedItem(undefined)
    setParentTransform(undefined)
  }, [])
  useDndMonitor({ onDragStart, onDragEnd, onDragMove })

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
                         highlight={highlight ?? (!disabled && !animations.length && !draggedItem)}
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

const isPlacedOnItem = <P extends number = number, M extends number = number, L extends number = number>(
  childItem: MaterialItem<P, L>, item: DisplayedItem<M>, context: MaterialContext<P, M, L>
): boolean => {
  if (childItem.location.parent === undefined) return false
  const locator = context.locators[childItem.location.type]
  if (locator.parentItemType === item.type && childItem.location.parent === item.index) return true
  const parentItem = context.game.items[item.type]![item.index]
  return isPlacedOnItem(parentItem, item, context)
}
