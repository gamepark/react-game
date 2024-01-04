/** @jsxImportSource @emotion/react */
import { DragMoveEvent, DragStartEvent, useDndMonitor, useDraggable } from '@dnd-kit/core'
import { css, Interpolation, Theme } from '@emotion/react'
import {
  DisplayedItem,
  displayMaterialHelp,
  isMoveItemType,
  isSelectItem,
  ItemMove,
  MaterialItem,
  MaterialMove,
  MaterialRules,
  MoveItem,
  XYCoordinates
} from '@gamepark/rules-api'
import merge from 'lodash/merge'
import { forwardRef, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { mergeRefs } from 'react-merge-refs'
import { useTransformContext } from 'react-zoom-pan-pinch'
import { grabbingCursor, grabCursor, pointerCursorCss } from '../../css'
import { useAnimation, useAnimations, useLegalMoves, useMaterialContext, usePlay, useRules, useUndo } from '../../hooks'
import { centerLocator, ItemContext } from '../../locators'
import { combineEventListeners } from '../../utilities'
import { gameContext } from '../GameProvider'
import { MaterialGameAnimations } from './animations'
import { MaterialComponent, MaterialComponentProps } from './MaterialComponent'
import { isDroppedItem } from './utils/isDroppedItem'
import { isPlacedOnItem } from './utils/isPlacedOnItem'
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
  const locator = context.locators[item.location.type] ?? centerLocator
  const displayedItem: DisplayedItem = useMemo(() => ({ type, index, displayIndex }), [type, index, displayIndex])
  const play = usePlay()
  const isAnimatingPlayerAction = useIsAnimatingPlayerAction()
  const legalMoves = useLegalMoves<MaterialMove>()
  const [undo, canUndo] = useUndo()
  const undoSelectItem = useMemo(() => {
    if (!item.selected) return
    const predicate = (move: MaterialMove) => isSelectItem(move) && move.itemType === type && move.itemIndex === index && item.selected === (move.quantity ?? true)
    if (!canUndo(predicate)) return
    return () => undo(predicate)
  }, [item, canUndo])

  const [onShortClick, onLongClick, canClickToMove] = useMemo(() => {
    const shortClickMoves = isAnimatingPlayerAction ? [] : legalMoves.filter(move => material[type]?.canShortClick(move, itemContext))
    const longClickMoves = isAnimatingPlayerAction ? [] : legalMoves.filter(move => material[type]?.canLongClick(move, itemContext))
    const openRules = () => play(displayMaterialHelp(type, item, index, displayIndex), { local: true })
    const onShortClick = undoSelectItem ?? (shortClickMoves.length === 1 ? () => play(shortClickMoves[0]) : openRules)
    const onLongClick = (undoSelectItem || shortClickMoves.length === 1) ? openRules : longClickMoves.length === 1 ? () => play(longClickMoves[0]) : undefined
    return [onShortClick, onLongClick, shortClickMoves.length === 1 || longClickMoves.length === 1]
  }, [legalMoves, itemContext, isAnimatingPlayerAction, play])

  const disabled = useMemo(() => isAnimatingPlayerAction || !legalMoves.some(move => material[type]?.canDrag(move, itemContext))
    , [legalMoves, itemContext, isAnimatingPlayerAction])

  const { attributes, listeners, transform: selfTransform, setNodeRef } = useDraggable({
    id: `${type}_${index}_${displayIndex}`,
    data: displayedItem,
    disabled
  })

  const [draggedItem, setDraggedItem] = useState<DisplayedItem>()
  const draggedItemContext = useMemo<ItemContext | undefined>(() => draggedItem && { ...context, ...draggedItem }, [draggedItem, context])
  const isDraggingParent = useMemo(() => !!item && !!draggedItem && isPlacedOnItem(item, draggedItem, context), [item, draggedItem, context])
  const canDropToSameLocation = useMemo(() => {
    if (!draggedItemContext) return false
    const location = locator.getLocationDescription(context)
    const description = material[draggedItemContext.type]
    return legalMoves.some(move => description?.canDrag(move, draggedItemContext) && location?.canDrop(move, item.location, draggedItemContext))
  }, [item, draggedItemContext, legalMoves])

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

  const isDropped = useMemo(() => isDroppedItem(itemContext), [itemContext])
  const applyTransform = isDropped || isDraggingParent || (!disabled && !ignoreTransform)
  if (!applyTransform) transformRef.current = undefined
  const animation = useItemAnimation(displayedItem, transformRef.current)

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

  const locatorTransform = useMemo(() => locator.transformItem(item, itemContext), [locator, item, itemContext])
  const transformStyle = (applyTransform ? [transformRef.current, ...locatorTransform] : locatorTransform).join(' ')

  return (
    <div css={[animationWrapperCss, animation]}>
      <MaterialComponent ref={mergeRefs([ref, setNodeRef])} type={type} itemId={item?.id}
                         css={[
                           !applyTransform && !animating && transformTransition,
                           !disabled && noTouchAction,
                           disabled ? pointerCursorCss : transform ? grabbingCursor : grabCursor,
                           canDropToSameLocation && noPointerEvents
                         ]}
                         style={{ transform: transformStyle }}
                         highlight={highlight ?? (!draggedItem && (!disabled || canClickToMove))}
                         {...props} {...attributes} {...combineEventListeners(listeners ?? {}, props)}
                         onShortClick={onShortClick} onLongClick={onLongClick}/>
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
  const rules = useRules<MaterialRules<P, M, L>>()
  const item = rules?.material(type).getItem(index)
  return useMemo(() =>
      item && typeof animation?.move.reveal === 'object' ? merge(JSON.parse(JSON.stringify(item)), animation.move.reveal) : item
    , [item, animation?.move.reveal])
}

const useItemAnimation = <P extends number = number, M extends number = number, L extends number = number>(
  displayedItem: DisplayedItem<M>, dragTransform?: string
): Interpolation<Theme> => {
  const { type, index } = displayedItem
  const context = useMaterialContext<P, M, L>()
  const animationsConfig = useContext(gameContext).animations as MaterialGameAnimations<P, M, L>
  const animations = useAnimations<ItemMove<P, M, L>, P>()
  const item = context.rules.material(type).getItem(index)
  if (!item || !animationsConfig) return
  const itemContext: ItemContext<P, M, L> = { ...context, ...displayedItem, dragTransform }
  for (const animation of animations) {
    const config = animationsConfig.getAnimationConfig(animation.move, { ...context, action: animation.action })
    const itemAnimation = config.getItemAnimation(itemContext, animation)
    if (itemAnimation) return itemAnimation
  }
  return
}
