/** @jsxImportSource @emotion/react */
import { DragMoveEvent, DragStartEvent, useDndMonitor, useDraggable } from '@dnd-kit/core'
import { css, Interpolation, Theme } from '@emotion/react'
import { DisplayedItem, isMoveItemType, isSelectItem, ItemMove, MaterialItem, MaterialMove, MaterialRules, MoveItem, XYCoordinates } from '@gamepark/rules-api'
import merge from 'lodash/merge'
import { forwardRef, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { mergeRefs } from 'react-merge-refs'
import { useTransformContext } from 'react-zoom-pan-pinch'
import { grabbingCursor, grabCursor, pointerCursorCss } from '../../css'
import { useAnimation, useAnimations, useLegalMoves, useMaterialContext, usePlay, useRules, useUndo } from '../../hooks'
import { ItemContext } from '../../locators'
import { combineEventListeners, findIfUnique } from '../../utilities'
import { gameContext } from '../GameProvider'
import { MaterialGameAnimations } from './animations'
import { ItemDisplay } from './GameTable/ItemDisplay'
import { MaterialComponentProps } from './MaterialComponent'
import { isDroppedItem } from './utils/isDroppedItem'
import { isPlacedOnItem } from './utils/isPlacedOnItem'

export type DraggableMaterialProps<M extends number = number> = {
  index: number
  displayIndex: number
  isFocused?: boolean
} & MaterialComponentProps<M>

export const DraggableMaterial = forwardRef<HTMLDivElement, DraggableMaterialProps>((
  { highlight, type, index, displayIndex, isFocused, ...props }, ref
) => {

  const context = useMaterialContext()
  const { material } = context
  const description = material[type]!
  const item = useRevealedItem(type, index)
  const itemContext = useMemo(() => ({ ...context, type, index, displayIndex }), [context])
  const displayedItem: DisplayedItem = useMemo(() => ({ type, index, displayIndex }), [type, index, displayIndex])
  const play = usePlay()
  const legalMoves = useLegalMoves<MaterialMove>()
  const [undo, canUndo] = useUndo()

  const lastShortClick = useRef(new Date().getTime())
  const onShortClick = useCallback(() => {
    const time = new Date().getTime()
    if (time - lastShortClick.current < 300) return
    lastShortClick.current = time
    const move = findIfUnique(legalMoves, move => description.canShortClick(move, itemContext))
    if (move !== undefined) return play(move)
    if (item.selected) {
      const predicate = (move: MaterialMove) => isSelectItem(move) && move.itemType === type && move.itemIndex === index && item.selected === (move.quantity ?? true)
      if (canUndo(predicate)) return undo(predicate)
    }

    const shortClickMove = description.getShortClickMove(itemContext)
    if (shortClickMove) return play(shortClickMove)

    const shortClickLocalMove = description.getShortClickLocalMove(itemContext)
    if (shortClickLocalMove) return play(shortClickLocalMove, { local: true })

    return play(description.displayHelp(item, itemContext), { local: true })
  }, [type, item, index, displayIndex, play, canUndo, undo, legalMoves])

  const onLongClick = useCallback(() => {
    if (item.selected) {
      const predicate = (move: MaterialMove) => isSelectItem(move) && move.itemType === type && move.itemIndex === index && item.selected === (move.quantity ?? true)
      if (canUndo(predicate)) return play(description.displayHelp(item, itemContext), { local: true })
    }
    const shortClickMove = findIfUnique(legalMoves, move => description.canShortClick(move, itemContext))
    if (shortClickMove !== undefined) return play(description.displayHelp(item, itemContext), { local: true })

    const shortClickLocalMove = description.getShortClickLocalMove(itemContext)
    if (shortClickLocalMove) return play(description.displayHelp(item, itemContext), { local: true })

    const move = findIfUnique(legalMoves, move => description.canLongClick(move, itemContext))
    if (move !== undefined) return play(move)
    return
  }, [type, item, index, displayIndex, play, canUndo, undo, legalMoves])

  const canClickToMove = useMemo(() => {
    let short = 0, long = 0
    if (description.getShortClickLocalMove(itemContext)) short++
    for (const move of legalMoves) {
      if (description.canShortClick(move, itemContext)) short++
      if (description.canLongClick(move, itemContext)) long++
      if (short > 1 && long > 1) return false
    }
    return short === 1 || long === 1
  }, [legalMoves])

  const disabled = useMemo(() => !legalMoves.some(move => description.canDrag(move, itemContext))
    , [legalMoves, itemContext])

  const { attributes, listeners, transform: selfTransform, setNodeRef } = useDraggable({
    id: `${type}_${index}_${displayIndex}`,
    data: displayedItem,
    disabled
  })

  const [draggedItem, setDraggedItem] = useState<DisplayedItem>()
  const draggedItemContext = useMemo<ItemContext | undefined>(() => draggedItem && { ...context, ...draggedItem }, [draggedItem, context])
  const isDraggingParent = useMemo(() => !!item && !!draggedItemContext && isPlacedOnItem(item, draggedItemContext), [item, draggedItemContext])
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

  const itemTransform = useMemo(() => description.getItemTransform(item, itemContext), [description, item, itemContext])
  const transformStyle = (applyTransform ? [transformRef.current, ...itemTransform] : itemTransform).join(' ')

  const componentCss = useMemo(() => [
    !applyTransform && !animating && transformTransition,
    !disabled && noTouchAction,
    disabled ? pointerCursorCss : transform ? grabbingCursor : grabCursor,
  ], [applyTransform, animating, disabled, transform])

  const wrapperCss = useMemo(() => [animationWrapperCss, animation], [animation])
  const style = useMemo(() => ({ transform: transformStyle }), [transformStyle])

  return (
    <div css={wrapperCss}>
      <ItemDisplay ref={ref ? mergeRefs([ref, setNodeRef]) : setNodeRef} type={type} index={index} displayIndex={displayIndex} item={item}
                   isFocused={isFocused}
                   css={componentCss}
                   style={style}
                   highlight={highlight ?? (!draggedItem && (!disabled || canClickToMove))}
                   {...props} {...attributes} {...combineEventListeners(listeners ?? {}, props)}
                   onShortClick={onShortClick} onLongClick={onLongClick}/>
    </div>
  )
})

DraggableMaterial.displayName = 'DraggableMaterial'

const animationWrapperCss = css`
  transform-style: preserve-3d;

  > * {
    position: absolute;
  }
`

const noTouchAction = css`
  touch-action: none;
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
  if (!animations.length) return
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
