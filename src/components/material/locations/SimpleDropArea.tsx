/** @jsxImportSource @emotion/react */
import { useDroppable } from '@dnd-kit/core'
import { css, keyframes, Theme } from '@emotion/react'
import { GamePageState } from '@gamepark/react-client'
import { Location, MaterialMove, MaterialMoveBuilder } from '@gamepark/rules-api'
import { forwardRef, HTMLAttributes, MouseEvent, useMemo, useState } from 'react'
import { mergeRefs } from 'react-merge-refs'
import { useSelector } from 'react-redux'
import { LongPressCallbackReason, LongPressEventType, useLongPress } from 'use-long-press'
import { pointerCursorCss, shineEffect } from '../../../css'
import { useLegalMoves, useMaterialContext, usePlay } from '../../../hooks'
import { combineEventListeners, findIfUnique } from '../../../utilities'
import { dataIsDisplayedItem } from '../DraggableMaterial'
import { DropAreaDescription } from './DropAreaDescription'
import { LocationDisplay } from './LocationDisplay'
import displayLocationHelp = MaterialMoveBuilder.displayLocationHelp

export type SimpleDropAreaProps<P extends number = number, L extends number = number> = {
  location: Location<P, L>
  onShortClick?: () => void
  onLongClick?: () => void
  alwaysVisible?: boolean
} & HTMLAttributes<HTMLDivElement>

export const SimpleDropArea = forwardRef<HTMLDivElement, SimpleDropAreaProps>((
  { location, onShortClick: shortClick, onLongClick: longClick, alwaysVisible, ...props }, ref
) => {
  const context = useMaterialContext()
  const material = context.material
  const locator = context.locators[location.type]
  const description = locator?.getLocationDescription(context) as DropAreaDescription
  const rules = context.rules
  const play = usePlay<MaterialMove>()
  const legalMoves = useLegalMoves()
  const dropMoves = useMemo(() => legalMoves.filter(move => description?.isMoveToLocation(move, location, context)), [legalMoves, context])

  const openRules = useMemo(() => {
    if (description.help) {
      return () => play(displayLocationHelp(location), { local: true })
    }
    const itemType = locator?.parentItemType
    if (itemType === undefined) return
    const item = rules.material(itemType).getItem(location.parent!)!
    if (!item) return
    return () => play(material[itemType]!.displayHelp(item, { ...context, type: itemType, index: location.parent!, displayIndex: 0 }), { local: true })
  }, [context])

  const onShortClick = useMemo(() => {
    const move = findIfUnique(legalMoves, move => description.canShortClick(move, location, context))
    if (move !== undefined) return () => play(move)

    const shortClickMove = description?.getShortClickMove(location, context)
    if (shortClickMove) return () => play(shortClickMove)

    const shortClickLocalMove = description?.getShortClickLocalMove(location, context)
    if (shortClickLocalMove) return () => play(shortClickLocalMove, { local: true })

    return openRules
  }, [legalMoves, context])

  const onLongClick = useMemo(() => {
    if (onShortClick !== openRules) return openRules
    const move = findIfUnique(legalMoves, move => description.canLongClick(move, location, context))
    if (move !== undefined) return () => play(move)
  }, [legalMoves, context])

  const canClickToMove = useMemo(() => {
    let short = 0, long = 0
    for (const move of legalMoves) {
      if (description?.canShortClick(move, location, context)) short++
      if (description?.canLongClick(move, location, context)) long++
      if (short > 1 && long > 1) return false
    }
    return short === 1 || long === 1
  }, [legalMoves, context])

  const { isOver, active, setNodeRef } = useDroppable({
    id: JSON.stringify(location),
    disabled: !dropMoves.length,
    data: location
  })

  const draggedItem = dataIsDisplayedItem(active?.data.current) ? active?.data.current : undefined
  const draggedItemContext = useMemo(() => draggedItem ? { ...context, ...draggedItem } : undefined, [draggedItem, context])
  const canDrop = useMemo(() => !!draggedItemContext && !!description && !!material && dropMoves.some(move =>
      material[draggedItemContext.type]?.canDrag(move, draggedItemContext) && description.canDrop(move, location, draggedItemContext)
    )
    , [draggedItemContext, dropMoves])

  const isAnimatingPlayerAction = useSelector((state: GamePageState) =>
    state.actions?.some(action => action.playerId === state.playerId && action.animation !== undefined)
  )
  const [clicking, setClicking] = useState(false)

  const listeners = useLongPress(() => {
    if (onLongClick) onLongClick()
    else if (onShortClick) onShortClick()
  }, {
    detect: LongPressEventType.Pointer,
    cancelOnMovement: 5,
    threshold: 600,
    onStart: event => {
      setClicking(true)
      event.stopPropagation()
    },
    onFinish: () => setClicking(false),
    onCancel: (_, { reason }) => {
      setClicking(false)
      if (onShortClick && reason === LongPressCallbackReason.CancelledByRelease) {
        setTimeout(() => onShortClick && onShortClick())
      }
    },
    filterEvents: event => !(event as MouseEvent).button // Ignore clicks on mouse buttons > 0
  })()

  if (!alwaysVisible && !description.isAlwaysVisible(location, context) && !canDrop) return null
  const highlight = description.highlight?.(location, context)

  return (
    <LocationDisplay ref={mergeRefs([ref, setNodeRef])} location={location} canDrop={canDrop}
                     css={[
                       (onShortClick || onLongClick) && pointerCursorCss,
                       !draggedItem && (onShortClick || onLongClick) && hoverHighlight, onLongClick && clicking && clickingAnimation,
                       (highlight || (canDrop && !isOver) || (!draggedItem && canClickToMove && !isAnimatingPlayerAction)) && shineEffect,
                       canDrop && isOver && dropHighlight
                     ]}
                     {...props} {...combineEventListeners(listeners, props)}/>
  )
})

SimpleDropArea.displayName = 'SimpleDropArea'

const hoverHighlight = css`
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`

const clickingKeyframes = (theme: Theme) => keyframes`
  from {
    background-color: rgba(255, 255, 255, 0.2);
  }
  to {
    background-color: ${theme.dropArea?.backgroundColor};
  }
`

const longClickThreshold = 600

const clickingAnimation = (theme: Theme) => css`
  animation: ${clickingKeyframes(theme)} ${longClickThreshold}ms ease-in-out;
`

const dropHighlight = (theme: Theme) => css`
  background-color: ${theme.dropArea?.backgroundColor};
`
