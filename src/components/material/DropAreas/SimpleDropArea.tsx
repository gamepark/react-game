/** @jsxImportSource @emotion/react */
import { HTMLAttributes, MouseEvent, useCallback, useRef, useState } from 'react'
import { displayLocationRules, Location, MaterialMoveType, MaterialRules, MaterialRulesMove, MoveKind } from '@gamepark/rules-api'
import { css, keyframes } from '@emotion/react'
import { LongPressCallbackReason, useLongPress } from 'use-long-press'
import { ItemLocator } from '../../../locators'
import { usePlay } from '../../../hooks'
import { shineEffect } from '../../../css'
import { useDroppable } from '@dnd-kit/core'
import { isMoveItemToLocation } from '../utils'
import { DragMaterialItem } from '../DraggableMaterial'

export type SimpleDropAreaProps<P extends number = number, M extends number = number, L extends number = number> = {
  locator: ItemLocator<P, M, L>
  location: Location<P, L>
  legalMoves: MaterialRulesMove<P, M, L>[]
  rules: MaterialRules<P, M, L>
  onLongPress?: () => void
} & HTMLAttributes<HTMLDivElement>

export const SimpleDropArea = <P extends number = number, M extends number = number, L extends number = number>(
  { locator, location, legalMoves, rules, onClick, onLongPress, ...props }: SimpleDropAreaProps<P, M, L>
) => {

  const play = usePlay<MaterialRulesMove<P, M, L>>()

  if (!onLongPress && legalMoves.length === 1) {
    onLongPress = () => play(legalMoves[0])
  }

  if (!onClick && locator.getLocationRules) {
    onClick = () => play(displayLocationRules(location), { local: true })
    if (!onLongPress) {
      onLongPress = () => play(displayLocationRules(location), { local: true })
    }
  }

  const { isOver, active, setNodeRef } = useDroppable({
    id: JSON.stringify(location),
    disabled: !legalMoves.length,
    data: location
  })

  const draggedItem = active?.data.current as DragMaterialItem | undefined

  const canDrop = draggedItem !== undefined && legalMoves.filter(move =>
    rules.isMoveTrigger(move, move =>
      isMoveItemToLocation(move, draggedItem.type, draggedItem.index, location)
    )
  ).length === 1

  const clicked = useRef(false)
  const [clicking, setClicking] = useState(false)
  const onShortClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (clicked.current) {
      if (onClick) {
        event.stopPropagation()
        onClick(event)
      }
    }
  }, [onClick])

  const bind = useLongPress(() => onLongPress && onLongPress(), {
    cancelOnMovement: 5,
    threshold: longClickThreshold,
    onStart: () => {
      if (onLongPress) {
        setClicking(true)
      }
      clicked.current = false
    },
    onFinish: () => setClicking(false),
    onCancel: (_, { reason }) => {
      setClicking(false)
      if (reason === LongPressCallbackReason.CancelledByRelease) {
        clicked.current = true
      }
    },
    filterEvents: event => !(event as MouseEvent).button // Ignore clicks on mouse buttons > 0
  })

  return <div ref={setNodeRef} onClick={onShortClick} {...bind()}
              css={[
                !draggedItem && (onClick || onLongPress) && hoverHighlight, clicking && clickingAnimation,
                (canDrop || (!draggedItem && legalMoves.length > 0)) && shineEffect,
                canDrop && isOver && dropHighlight
              ]}
              {...props}/>
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
  move: MaterialRulesMove<P, M, L>, rules: MaterialRules<P, M, L>
): number[] => {
  switch (move.kind) {
    case MoveKind.MaterialMove:
      return move.type === MaterialMoveType.Move ? [move.itemType] : []
    case MoveKind.CustomMove:
      return rules.play(move).flatMap(move => getMoveItemTypes(move, rules))
    default:
      return []
  }
}
