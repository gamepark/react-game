/** @jsxImportSource @emotion/react */
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DisplayedItem, isMoveItemType, ItemMove, MaterialGame, MaterialItem, MaterialMove, MoveItem, XYCoordinates } from '@gamepark/rules-api'
import { MaterialComponent, MaterialComponentProps } from './MaterialComponent'
import { grabbingCursor, grabCursor, pointerCursorCss, transformCss } from '../../css'
import { DragMoveEvent, DragStartEvent, useDndMonitor, useDraggable } from '@dnd-kit/core'
import { css, Interpolation, Theme } from '@emotion/react'
import { combineEventListeners } from '../../utilities'
import { useAnimation, useAnimations, useGame, useLegalMoves, useMaterialAnimations, useMaterialContext, usePlay } from '../../hooks'
import merge from 'lodash/merge'
import { mergeRefs } from 'react-merge-refs'
import { useTransformContext } from 'react-zoom-pan-pinch'
import { isPlacedOnItem } from './utils/isPlacedOnItem'
import { isDroppedItem } from './utils/isDroppedItem'
import { useIsAnimatingPlayerAction } from './utils/useIsAnimatingPlayerAction'

export type DraggableMaterialProps<M extends number = number> = {
  index: number
  displayIndex: number
} & MaterialComponentProps<M>

export const DraggableMaterial = forwardRef<HTMLDivElement, DraggableMaterialProps>((
  { highlight, type, index, displayIndex, ...props }, ref
) => {

  const context = useMaterialContext()
  const { material } = context
  const item = useRevealedItem(type, index)
  const itemContext = useMemo(() => ({ ...context, type, index, displayIndex }), [context])
  const locator = context.locators[item.location.type]
  const displayedItem: DisplayedItem = useMemo(() => ({ type, index, displayIndex }), [type, index, displayIndex])
  const play = usePlay()
  const isAnimatingPlayerAction = useIsAnimatingPlayerAction()
  const legalMoves = useLegalMoves<MaterialMove>()
  const longClickMove = useMemo(() => {
    if (isAnimatingPlayerAction) return
    const eligibleMoves = legalMoves.filter(move => material[type].canLongClick(move, itemContext))
    return eligibleMoves.length === 1 ? eligibleMoves[0] : undefined
  }, [legalMoves, itemContext, isAnimatingPlayerAction])
  const disabled = useMemo(() => isAnimatingPlayerAction || !legalMoves.some(move => material[type].canDrag(move, itemContext))
    , [legalMoves, itemContext, isAnimatingPlayerAction])

  const { attributes, listeners, transform: selfTransform, setNodeRef } = useDraggable({
    id: `${type}_${index}_${displayIndex}`,
    data: displayedItem,
    disabled
  })

  const [draggedItem, setDraggedItem] = useState<DisplayedItem>()
  const isDraggingParent = useMemo(() => !!item && !!draggedItem && isPlacedOnItem(item, draggedItem, context), [item, draggedItem, context])
  const canDropToSameLocation = useMemo(() => {
    if (!draggedItem) return false
    const location = locator.locationDescription
    const description = material[draggedItem.type]
    return legalMoves.some(move => description.canDrag(move, { ...context, ...draggedItem }) && location?.canDrop(move, item.location, context))
  }, [item, draggedItem, legalMoves])

  const [parentTransform, setParentTransform] = useState<XYCoordinates>()
  const transform = selfTransform ?? parentTransform

  // We need to delay a little the default transition removal when dragging starts, otherwise dnd-kit suffers from transform side effect
  // because we opted out from ignoring transform in the configuration (using: "draggable: { measure: getClientRect }")
  const [ignoreTransform, setIgnoreTransform] = useState(true)
  useEffect(() => {
    if (transform) {
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

  const animation = useItemAnimation(displayedItem)
  const isDropped = useMemo(() => isDroppedItem(itemContext), [itemContext])
  const applyTransform = isDropped || !ignoreTransform || !!animation
  if (!applyTransform) transformRef.current = undefined

  // Firefox bugs when the animation is immediately followed by the transition: we need to delay by 1 rerender putting back the transition
  const [animating, setAnimating] = useState(!!animation)
  useEffect(() => setAnimating(!!animation), [!animation])

  const onDragStart = useCallback((event: DragStartEvent) => dataIsDisplayedItem(event.active.data.current) && setDraggedItem(event.active.data.current), [])
  const onDragMove = useCallback((event: DragMoveEvent) => isDraggingParent && setParentTransform(event.delta), [isDraggingParent])
  const onDragEnd = useCallback(() => {
    setDraggedItem(undefined)
    setParentTransform(undefined)
  }, [])
  useDndMonitor({ onDragStart, onDragEnd, onDragMove })

  return (
    <div css={[animationWrapperCss, animation]}>
      <MaterialComponent ref={mergeRefs([ref, setNodeRef])} type={type} itemId={item?.id}
                         css={[
                           !applyTransform && !animating && transformTransition,
                           !disabled && noTouchAction,
                           disabled ? pointerCursorCss : transform ? grabbingCursor : grabCursor,
                           transformCss(applyTransform && transformRef.current, ...locator.transformItem(item, itemContext)),
                           canDropToSameLocation && noPointerEvents
                         ]}
                         highlight={highlight ?? (!draggedItem && (!disabled || longClickMove !== undefined))}
                         {...props} {...attributes} {...combineEventListeners(listeners ?? {}, props)}
                         onLongClick={longClickMove ? () => play(longClickMove) : undefined}/>
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

const useRevealedItem = <P extends number = number, M extends number = number, L extends number = number>(
  type: M, index: number
): MaterialItem<P, L> => {
  const animation = useAnimation<MoveItem<P, M, L>>(animation => isMoveItemType(type, index)(animation.move))
  const game = useGame<MaterialGame<P, M, L>>()
  const item = game?.items[type]?.[index]
  return useMemo(() =>
      item && typeof animation?.move.reveal === 'object' ? merge(JSON.parse(JSON.stringify(item)), animation.move.reveal) : item
    , [item, animation?.move.reveal])
}

const useItemAnimation = <P extends number = number, M extends number = number, L extends number = number>(
  displayedItem: DisplayedItem<M>
): Interpolation<Theme> => {
  const { type, index } = displayedItem
  const context = useMaterialContext<P, M, L>()
  const materialAnimations = useMaterialAnimations<P, M, L>(type)
  const animations = useAnimations<ItemMove<P, M, L>>()
  const item = context.game?.items[type]?.[index]
  if (!item || !materialAnimations) return
  for (const animation of animations) {
    const itemAnimation = materialAnimations.getItemAnimation({ ...context, ...displayedItem }, animation)
    if (itemAnimation) return itemAnimation
  }
  return
}

