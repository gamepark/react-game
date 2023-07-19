/** @jsxImportSource @emotion/react */
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DisplayedItem, isMoveItem, ItemMove, MaterialGame, MaterialItem, MaterialMove, MoveItem, XYCoordinates } from '@gamepark/rules-api'
import { MaterialComponent, MaterialComponentProps } from './MaterialComponent'
import { grabbingCursor, grabCursor, pointerCursorCss, transformCss } from '../../css'
import { DragMoveEvent, DragStartEvent, useDndMonitor, useDraggable } from '@dnd-kit/core'
import { css, Interpolation, Theme } from '@emotion/react'
import { combineEventListeners } from '../../utilities'
import { useAnimation, useAnimations, useGame, useLegalMoves, useMaterialAnimations, useMaterialContext, usePlay, usePlayerId } from '../../hooks'
import merge from 'lodash/merge'
import equal from 'fast-deep-equal'
import { mergeRefs } from 'react-merge-refs'
import { useTransformContext } from 'react-zoom-pan-pinch'
import { MaterialContext } from '../../locators'

export type DraggableMaterialProps<M extends number = number> = {
  index: number
  displayIndex: number
  preTransform?: string
  postTransform?: string
} & MaterialComponentProps<M>

export const DraggableMaterial = forwardRef<HTMLDivElement, DraggableMaterialProps>((
  { highlight, type, index, displayIndex, preTransform, postTransform, ...props }, ref
) => {

  const context = useMaterialContext()
  const { game: { droppedItem }, locators, material } = context
  const item = useRevealedItem(type, index)
  const displayedItem: DisplayedItem = useMemo(() => ({ type, index, displayIndex }), [type, index, displayIndex])
  const play = usePlay()
  const legalMoves = useLegalMoves<MaterialMove>()
  const itemMoves = useMemo(() =>
      legalMoves.filter(move => material[type].canDrag(move, { ...context, type, index, displayIndex }))
    , [legalMoves])
  const isAnimatingPlayerAction = useIsAnimatingPlayerAction()
  const disabled = !itemMoves.length || isAnimatingPlayerAction

  const { attributes, listeners, transform: selfTransform, setNodeRef } = useDraggable({
    id: `${type}_${index}_${displayIndex}`,
    data: displayedItem,
    disabled
  })

  const [draggedItem, setDraggedItem] = useState<DisplayedItem>()
  const isDraggingParent = useMemo(() => !!item && !!draggedItem && isPlacedOnItem(item, draggedItem, context), [item, draggedItem, context])
  const canDropToSameLocation = useMemo(() => {
    if (!draggedItem || !item) return false
    const location = locators[item.location.type].locationDescription
    const description = material[draggedItem.type]
    return legalMoves.some(move => description.canDrag(move, { ...context, ...draggedItem }) && location?.canDrop(move, item.location, context))
  }, [item, draggedItem, legalMoves])

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

  const animation = useItemAnimation(displayedItem)
  const isDroppedItem = !!droppedItem && !!item && (equal(droppedItem, displayedItem) || isPlacedOnItem(item, droppedItem, context))
  const applyTransform = isDroppedItem || !ignoreTransform

  // We have to disable the "smooth return transition" when we have an animation, because Firefox bugs when the animation is followed by a transition
  useEffect(() => {
    if (animation) {
      setSmoothReturn(false)
    }
  }, [animation])

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
                           !applyTransform && smoothReturn && transformTransition,
                           !disabled && noTouchAction,
                           disabled ? pointerCursorCss : transform ? grabbingCursor : grabCursor,
                           transformCss(preTransform, applyTransform && transformRef.current, postTransform),
                           canDropToSameLocation && noPointerEvents
                         ]}
                         highlight={highlight ?? (!disabled && !draggedItem)}
                         {...props} {...attributes} {...combineEventListeners(listeners ?? {}, props)}
                         onLongClick={itemMoves.length === 1 ? () => play(itemMoves[0]) : undefined}/>
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

const useRevealedItem = <P extends number = number, M extends number = number, L extends number = number>(
  type: M, index: number
): MaterialItem<P, L> | undefined => {
  const animation = useAnimation<MoveItem<P, M, L>>(animation => isMoveItem(animation.move, type, index))
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

const useIsAnimatingPlayerAction = (): boolean => {
  const player = usePlayerId()
  return useAnimations<MaterialMove>(animation => animation.action.playerId === player).length > 0
}
