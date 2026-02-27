import { DragMoveEvent, DragStartEvent, useDndMonitor, useDraggable } from '@dnd-kit/core'
import { css, Interpolation, Theme } from '@emotion/react'
import { DisplayedItem, GridBoundaries, isMoveItemsAtOnce, isSelectItem, MaterialItem, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { isEqual } from 'es-toolkit'
import React, { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { grabbingCursor, grabCursor } from '../../css'
import { CanUndo, UndoFunction } from '../../hooks'
import { useMaterialContextRef, usePlay } from '../../hooks'
import { getLocationOriginCss, ItemContext } from '../../locators'
import { combineEventListeners, findIfUnique } from '../../utilities'
import { useScale } from './GameTable'
import { ItemDisplay } from './GameTable/ItemDisplay'
import { ItemMenuWrapper } from './ItemMenuWrapper'
import { MaterialComponentProps } from './MaterialComponent'
import { isDroppedItem } from './utils/isDroppedItem'
import { isPlacedOnItem } from './utils/isPlacedOnItem'

export type DraggableMaterialProps<M extends number = number> = {
  index: number
  displayIndex: number
  boundaries: GridBoundaries
  isFocused?: boolean
  item: MaterialItem
  disabled: boolean
  positionDeps: unknown
  legalMoves: MaterialMove[]
  animation?: Interpolation<Theme>
  undo: UndoFunction<MaterialMove>
  canUndo: CanUndo<MaterialMove>
} & MaterialComponentProps<M>

function arePropsEqual(prev: DraggableMaterialProps, next: DraggableMaterialProps) {
  if (prev.type !== next.type || prev.index !== next.index || prev.displayIndex !== next.displayIndex) return false
  // positionDeps === undefined means always recompute
  if (next.positionDeps === undefined) return false
  if (!isEqual(prev.positionDeps, next.positionDeps)) return false
  if (!isEqual(prev.item, next.item)) return false
  if (prev.disabled !== next.disabled) return false
  if (!isEqual(prev.boundaries, next.boundaries)) return false
  if (prev.isFocused !== next.isFocused) return false
  if (prev.legalMoves !== next.legalMoves) return false
  if (prev.highlight !== next.highlight) return false
  if (prev.title !== next.title) return false
  if (prev.animation !== next.animation) return false
  if (prev.undo !== next.undo) return false
  if (prev.canUndo !== next.canUndo) return false
  return true
}

const DraggableMaterialBase = <M extends number = number>(
  { type, index, displayIndex, item, disabled, legalMoves, animation, undo, canUndo, ...props }: DraggableMaterialProps<M>
) => {
  const displayedItem: DisplayedItem = useMemo(() => ({ type, index, displayIndex }), [type, index, displayIndex])
  const { attributes, listeners, transform, setNodeRef } = useDraggable({ id: `${type}_${index}_${displayIndex}`, data: displayedItem, disabled })

  return <DraggableMaterialInner ref={setNodeRef} transform={transform ?? undefined} disabled={disabled}
                                 type={type} index={index} displayIndex={displayIndex} item={item}
                                 legalMoves={legalMoves} animation={animation}
                                 undo={undo} canUndo={canUndo}
                                 {...props} {...attributes}
                                 {...combineEventListeners(listeners ?? {}, props)}/>
}
DraggableMaterialBase.displayName = 'DraggableMaterial'

export const DraggableMaterial = memo(DraggableMaterialBase, arePropsEqual) as <M extends number = number>(props: DraggableMaterialProps<M>) => React.ReactElement | null

type DraggableMaterialInnerProps<M extends number = number> = DraggableMaterialProps<M> & {
  transform?: XYCoordinates
}

const DraggableMaterialInnerBase = forwardRef<HTMLDivElement, DraggableMaterialInnerProps>((
  { highlight, type, index, displayIndex, boundaries, isFocused, transform, disabled, item, legalMoves, positionDeps, animation: animationProp, undo, canUndo, ...props }: DraggableMaterialInnerProps, ref
) => {
  const context = useMaterialContextRef()
  const { material, rules } = context
  const description = material[type]!
  const itemContext = useMemo(() => ({ ...context, type, index, displayIndex }), [context, type, index, displayIndex])
  const locator = context.locators[item.location.type]
  const play = usePlay()
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

  const [draggedItem, setDraggedItem] = useState<DisplayedItem>()
  const draggedItemContext = useMemo<ItemContext | undefined>(() => draggedItem && { ...context, ...draggedItem }, [draggedItem, context])
  const isDraggingParent = useMemo(() => !!item && !!draggedItemContext &&
      (isPlacedOnItem(item, draggedItemContext) || legalMoves.some((move) =>
        isMoveItemsAtOnce(move) && move.itemType === type && move.indexes.includes(index) && move.indexes.includes(draggedItemContext.index)
        && description.canDrag(move, draggedItemContext) && description.canDrag(move, itemContext)
      ))
    , [item, draggedItemContext, legalMoves])
  const [parentTransform, setParentTransform] = useState<XYCoordinates>()
  transform = transform ?? parentTransform

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

  const scale = useScale()
  const transformRef = useRef<string>('')
  if (transform && !ignoreTransform) {
    const { x, y } = transform
    transformRef.current = `translate3d(${Math.round(x / scale)}px, ${y ? Math.round(y / scale) : 0}px, 20em)`
  }

  const isDropped = useMemo(() => isDroppedItem(itemContext), [itemContext])
  const applyTransform = isDropped || isDraggingParent || (!disabled && !ignoreTransform)
  if (!applyTransform) transformRef.current = ''
  const animation = animationProp

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

  const locationOriginCss = getLocationOriginCss(boundaries, locator?.getLocationOrigin(item.location, itemContext))

  return <>
    <ItemDisplay ref={ref} type={type} index={index} displayIndex={displayIndex} item={item}
                 isFocused={isFocused}
                 css={[
                   locationOriginCss,
                   !applyTransform && !animating && transformTransition,
                   !disabled && noTouchAction,
                   !disabled && (transform ? grabbingCursor : grabCursor),
                   animationWrapperCss
                 ]}
                 dragTransform={applyTransform ? transformRef.current : undefined}
                 animation={animation}
                 highlight={highlight ?? (!draggedItem && (!disabled || onShortClickMove !== undefined || onLongClickMove !== undefined))}
                 {...props}
                 onShortClick={unselect ?? onShortClickMove} onLongClick={onLongClickMove}/>
    {menu && (menuAlwaysVisible || item.selected) &&
      <ItemMenuWrapper item={item} itemContext={itemContext} description={description} {...props} css={locationOriginCss}>{menu}</ItemMenuWrapper>
    }
  </>
})
DraggableMaterialInnerBase.displayName = 'DraggableMaterialInner'

const DraggableMaterialInner = memo(DraggableMaterialInnerBase)

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
