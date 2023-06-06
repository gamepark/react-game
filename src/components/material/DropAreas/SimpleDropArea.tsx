/** @jsxImportSource @emotion/react */
import { HTMLAttributes, MouseEvent, useState } from 'react'
import { displayLocationRules, ItemMoveType, Location, MaterialMove, MaterialRules, MoveKind } from '@gamepark/rules-api'
import { css, keyframes } from '@emotion/react'
import { LongPressCallbackReason, LongPressEventType, useLongPress } from 'use-long-press'
import { useItemLocator, usePlay, usePlayerId, useRules } from '../../../hooks'
import { shineEffect } from '../../../css'
import { useDroppable } from '@dnd-kit/core'
import { isMoveThisItemToLocation } from '../utils'
import { DragMaterialItem } from '../DraggableMaterial'
import { combineEventListeners } from '../../../utilities'

export type SimpleDropAreaProps<P extends number = number, M extends number = number, L extends number = number> = {
  location: Location<P, L>
  legalMoves: MaterialMove<P, M, L>[]
  onShortClick?: () => void
  onLongClick?: () => void
} & HTMLAttributes<HTMLDivElement>

export const SimpleDropArea = <P extends number = number, M extends number = number, L extends number = number>(
  { location, legalMoves, onShortClick, onLongClick, ...props }: SimpleDropAreaProps<P, M, L>
) => {
  const locator = useItemLocator(location.type)
  const rules = useRules<MaterialRules>()
  const play = usePlay<MaterialMove<P, M, L>>()
  const player = usePlayerId()

  if (!onLongClick && legalMoves.length === 1) {
    onLongClick = () => play(legalMoves[0], { delayed: rules?.isUnpredictableMove(legalMoves[0], player) })
  }

  if (!onShortClick && locator?.getLocationRules) {
    onShortClick = () => play(displayLocationRules(location), { local: true })
    if (!onLongClick) {
      onLongClick = () => play(displayLocationRules(location), { local: true })
    }
  }

  const { isOver, active, setNodeRef } = useDroppable({
    id: JSON.stringify(location),
    disabled: !legalMoves.length,
    data: location
  })

  const draggedItem = active?.data.current as DragMaterialItem | undefined

  const canDrop = draggedItem !== undefined && legalMoves.filter(move =>
    rules?.isMoveTrigger(move, move =>
      isMoveThisItemToLocation(move, draggedItem.type, draggedItem.index, location)
    )
  ).length === 1

  const [clicking, setClicking] = useState(false)

  const listeners = useLongPress(() => onLongClick && onLongClick(), {
    detect: LongPressEventType.Pointer,
    cancelOnMovement: 5,
    threshold: 600,
    onStart: event => {
      setClicking(true)
      if (onShortClick || onLongClick) {
        event.stopPropagation()
      }
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

  return <div ref={setNodeRef}
              css={[
                !draggedItem && (onShortClick || onLongClick) && hoverHighlight, clicking && clickingAnimation,
                (canDrop || (!draggedItem && legalMoves.length > 0)) && shineEffect,
                canDrop && isOver && dropHighlight
              ]}
              {...props} {...combineEventListeners(listeners, props)}/>
}

const hoverHighlight = css`
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`

const clickingKeyframes = keyframes`
  from {
    background-color: rgba(255, 255, 255, 0.2);
  }
  to {
    background-color: rgba(0, 255, 0, 0.5);
  }
`

const longClickThreshold = 600

const clickingAnimation = css`
  animation: ${clickingKeyframes} ${longClickThreshold}ms ease-in-out;
`

const dropHighlight = css`
  background-color: rgba(0, 255, 0, 0.5);
`

const getMoveItemTypes = <P extends number = number, M extends number = number, L extends number = number>(
  move: MaterialMove<P, M, L>, rules: MaterialRules<P, M, L>
): number[] => {
  switch (move.kind) {
    case MoveKind.ItemMove:
      return move.type === ItemMoveType.Move ? [move.itemType] : []
    case MoveKind.CustomMove:
      return rules.play(move).flatMap(move => getMoveItemTypes(move, rules))
    default:
      return []
  }
}
