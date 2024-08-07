/** @jsxImportSource @emotion/react */
import { useDroppable } from '@dnd-kit/core'
import { css, keyframes, Theme } from '@emotion/react'
import { GamePageState } from '@gamepark/react-client'
import { displayLocationHelp, Location, MaterialMove } from '@gamepark/rules-api'
import { forwardRef, HTMLAttributes, MouseEvent, useCallback, useMemo, useState } from 'react'
import { mergeRefs } from 'react-merge-refs'
import { useSelector } from 'react-redux'
import { LongPressCallbackReason, LongPressEventType, useLongPress } from 'use-long-press'
import { pointerCursorCss, shineEffect } from '../../../css'
import { useLegalMoves, useMaterialContext, usePlay } from '../../../hooks'
import { combineEventListeners, findIfUnique } from '../../../utilities'
import { dataIsDisplayedItem } from '../DraggableMaterial'
import { LocationDisplay } from './LocationDisplay'

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
  const description = locator?.getLocationDescription(context)
  const rules = context.rules
  const play = usePlay<MaterialMove>()
  const legalMoves = useLegalMoves()
  const dropMoves = useMemo(() => legalMoves.filter(move => description?.isMoveToLocation(move, location, context)), [legalMoves, context])

  const openRules = useCallback(() => {
    if (rules && (locator?.locationDescription?.help || locator?.parentItemType !== undefined)) {
      if (locator?.locationDescription?.help) {
        return play(displayLocationHelp(location), { local: true })
      } else {
        const itemType = locator!.parentItemType!
        const item = rules.material(itemType).getItem(location.parent!)!
        return play(material[itemType]!.displayHelp(item, { ...context, type: itemType, index: location.parent!, displayIndex: 0 }), { local: true })
      }
    }
  }, [locator])

  const onShortClick = useCallback(() => {
    const move = description ? findIfUnique(legalMoves, move => description.canShortClick(move, location, context)) : undefined
    if (move !== undefined) return play(move)

    const shortClickMove = description?.getShortClickMove(location, context)
    if (shortClickMove) return play(shortClickMove)

    const shortClickLocalMove = description?.getShortClickLocalMove(location, context)
    if (shortClickLocalMove) return play(shortClickLocalMove, { local: true })

    return openRules()
  }, [legalMoves, context])

  const onLongClick = useCallback(() => {
    const shortClickMove = description ? findIfUnique(legalMoves, move => description.canShortClick(move, location, context)) : undefined
    if (shortClickMove !== undefined) {
      openRules()
    } else {
      const move = description ? findIfUnique(legalMoves, move => description.canLongClick(move, location, context)) : undefined
      if (move !== undefined) play(move)
      else openRules()
    }

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

  if (!description) { // TODO: parent should never include a simple drop area which description is missing at all
    console.warn('You must provide a LocationDescription to create drop locations with an ItemLocator')
    return null
  }

  if (!alwaysVisible && !description.isAlwaysVisible(location, context) && !canDrop) return null
  const highlight = description.highlight?.(location, context)

  return (
    <LocationDisplay ref={mergeRefs([ref, setNodeRef])} location={location} canDrop={canDrop}
                     css={[
                       (onShortClick || onLongClick) && pointerCursorCss,
                       !draggedItem && (onShortClick || onLongClick) && hoverHighlight, clicking && clickingAnimation,
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
