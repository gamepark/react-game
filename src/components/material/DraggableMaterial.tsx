/** @jsxImportSource @emotion/react */
import { DragMoveEvent, DragStartEvent, useDndMonitor, useDraggable } from '@dnd-kit/core'
import { css, Interpolation, Theme } from '@emotion/react'
import {
  DisplayedItem,
  isMoveItem,
  isMoveItemsAtOnce,
  isMoveItemType,
  isMoveItemTypeAtOnce,
  isSelectItem,
  ItemMove,
  MaterialItem,
  MaterialMove,
  MaterialRules,
  MoveItem,
  MoveItemsAtOnce,
  XYCoordinates
} from '@gamepark/rules-api'
import merge from 'lodash/merge'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useTransformContext } from 'react-zoom-pan-pinch'
import { grabbingCursor, grabCursor } from '../../css'
import { useAnimation, useAnimations, useLegalMoves, useMaterialContext, usePlay, useRules, useUndo } from '../../hooks'
import { ItemContext } from '../../locators'
import { combineEventListeners, findIfUnique } from '../../utilities'
import { gameContext } from '../GameProvider'
import { MaterialGameAnimations } from './animations'
import { ItemDisplay } from './GameTable/ItemDisplay'
import { ItemMenuWrapper } from './ItemMenuWrapper'
import { MaterialComponentProps } from './MaterialComponent'
import { isDroppedItem } from './utils/isDroppedItem'
import { isPlacedOnItem } from './utils/isPlacedOnItem'

export type DraggableMaterialProps<M extends number = number> = {
  index: number
  displayIndex: number
  isFocused?: boolean
} & MaterialComponentProps<M>

export const DraggableMaterial = <M extends number = number>(
  { highlight, type, index, displayIndex, isFocused, ...props }: DraggableMaterialProps<M>
) => {

  const context = useMaterialContext()
  const { material, rules } = context
  const description = material[type]!
  const item = useRevealedItem(type, index)
  const itemContext = useMemo(() => ({ ...context, type, index, displayIndex }), [context])
  const displayedItem: DisplayedItem = useMemo(() => ({ type, index, displayIndex }), [type, index, displayIndex])
  const play = usePlay()
  const legalMoves = useLegalMoves<MaterialMove>()
  const [undo, canUndo] = useUndo()
  const menu = description.getItemMenu(item, itemContext, legalMoves)
  const menuAlwaysVisible = description.isMenuAlwaysVisible(item, itemContext)

  const unselect = useMemo(() => {
    if (item.selected) {
      const predicate = (move: MaterialMove) => isSelectItem(move) && move.itemType === type && move.itemIndex === index && item.selected === (move.quantity ?? true)
      if (canUndo(predicate)) return () => undo(predicate)
    }
  }, [item, itemContext, canUndo, undo])

  const onShortClickMove = useMemo(() => {
    const move = findIfUnique(legalMoves, move => description.canShortClick(move, itemContext))
    if (move !== undefined) return () => play(move)
    const shortClickMove = description.getShortClickMove(itemContext)
    if (shortClickMove) return () => play(shortClickMove)
    const shortClickLocalMove = description.getShortClickLocalMove(itemContext)
    if (shortClickLocalMove) return () => play(shortClickLocalMove, { local: true })
    if (menu && !menuAlwaysVisible) {
      return () => {
        if (item.selected) {
          play(rules.material(type).index(index).unselectItem(), { transient: true })
        } else {
          play(rules.material(type).index(index).selectItem(), { transient: true })
          for (const unselectItem of rules.material(type).selected().unselectItems()) {
            play(unselectItem, { transient: true })
          }
        }
      }
    }
  }, [itemContext, play, legalMoves])

  const onLongClickMove = useMemo(() => {
    if (unselect || onShortClickMove) return
    const move = findIfUnique(legalMoves, move => description.canLongClick(move, itemContext))
    if (move !== undefined) return () => play(move)
  }, [itemContext, play, legalMoves])

  const hadMenu = useRef(!!menu)
  useEffect(() => {
    if (hadMenu.current && !menu && !menuAlwaysVisible && item.selected) {
      play(rules.material(type).index(index).unselectItem(), { transient: true })
    }
    hadMenu.current = !!menu
  }, [!menu])

  const disabled = useMemo(() => !legalMoves.some(move => description.canDrag(move, itemContext))
    , [legalMoves, itemContext])

  const { attributes, listeners, transform: selfTransform, setNodeRef } = useDraggable({
    id: `${type}_${index}_${displayIndex}`,
    data: displayedItem,
    disabled
  })

  const [draggedItem, setDraggedItem] = useState<DisplayedItem>()
  const draggedItemContext = useMemo<ItemContext | undefined>(() => draggedItem && { ...context, ...draggedItem }, [draggedItem, context])
  const isDraggingParent = useMemo(() => !!item && !!draggedItemContext &&
      (isPlacedOnItem(item, draggedItemContext) || legalMoves.some((move) =>
        isMoveItemsAtOnce(move) && move.itemType === type && move.indexes.includes(index) && move.indexes.includes(draggedItemContext.index)
        && description.canDrag(move, draggedItemContext) && description.canDrag(move, itemContext)
      ))
    , [item, draggedItemContext, legalMoves])
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

  return <>
    <ItemDisplay ref={setNodeRef} type={type} index={index} displayIndex={displayIndex} item={item}
                 isFocused={isFocused}
                 css={[
                   !applyTransform && !animating && transformTransition,
                   !disabled && noTouchAction,
                   !disabled && (transform ? grabbingCursor : grabCursor),
                   animationWrapperCss
                 ]}
                 dragTransform={applyTransform ? transformRef.current : undefined}
                 animation={animation}
                 highlight={highlight ?? (!draggedItem && (!disabled || onShortClickMove !== undefined || onLongClickMove !== undefined))}
                 {...props} {...attributes} {...combineEventListeners(listeners ?? {}, props)}
                 onShortClick={unselect ?? onShortClickMove} onLongClick={onLongClickMove}/>
    {menu && (menuAlwaysVisible || item.selected) &&
      <ItemMenuWrapper item={item} itemContext={itemContext} description={description} {...props}>{menu}</ItemMenuWrapper>
    }
  </>
}

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
  > * {
    transition: transform 0.2s ease-in-out;
  }
`

export function dataIsDisplayedItem<M extends number = number>(data?: Record<string, any>): data is DisplayedItem<M> {
  return typeof data?.type === 'number' && typeof data?.index === 'number' && typeof data?.displayIndex === 'number'
}

const useRevealedItem = <P extends number = number, M extends number = number, L extends number = number>(
  type: M, index: number
): MaterialItem<P, L> => {
  const rules = useRules<MaterialRules<P, M, L>>()
  const item = rules?.material(type).getItem(index)
  const animation = useAnimation<MoveItem<P, M, L> | MoveItemsAtOnce<P, M, L>>(animation =>
    (isMoveItemType(type, index)(animation.move) && animation.move.reveal !== undefined)
    || (isMoveItemTypeAtOnce(type)(animation.move) && animation.move.reveal?.[index] !== undefined)
  )
  const reveal = animation ? (isMoveItem(animation.move) ? animation.move.reveal : animation.move.reveal?.[index]) : undefined
  return useMemo(() => merge(JSON.parse(JSON.stringify(item)), reveal), [item, reveal])
}

const useItemAnimation = <P extends number = number, M extends number = number, L extends number = number>(
  displayedItem: DisplayedItem<M>, dragTransform?: string
): Interpolation<Theme> => {
  const { type, index } = displayedItem
  const context = useMaterialContext<P, M, L>()
  const animationsConfig = useContext(gameContext).animations as MaterialGameAnimations<P, M, L>
  const animations = useAnimations<ItemMove<P, M, L>, P>()
  const animationCache = useRef<{ move: MaterialMove<P, M, L>, itemAnimation: Interpolation<Theme> }>()
  if (!animations.length) return
  const item = context.rules.material(type).getItem(index)
  if (!item || !animationsConfig) return
  const itemContext: ItemContext<P, M, L> = { ...context, ...displayedItem, dragTransform }
  for (const animation of animations) {
    const config = animationsConfig.getAnimationConfig(animation.move, { ...context, action: animation.action })
    const itemAnimation = config.getItemAnimation(itemContext, animation)
    if (itemAnimation) {
      if (animationCache.current?.move !== animation.move) {
        // Remember current item animation for each move so that it does not restart if the item's origin changes in between
        animationCache.current = { move: animation.move, itemAnimation }
      }
      return animationCache.current.itemAnimation
    }
  }
  animationCache.current = undefined
}
