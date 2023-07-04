/** @jsxImportSource @emotion/react */
import { forwardRef, HTMLAttributes, MouseEvent, useState } from 'react'
import { displayLocationRules, ItemMove, ItemMoveType, Location, MaterialMove, MaterialRules, MoveKind } from '@gamepark/rules-api'
import { css, keyframes } from '@emotion/react'
import { LongPressCallbackReason, LongPressEventType, useLongPress } from 'use-long-press'
import { useAnimations, useItemLocator, useLegalMoves, usePlay, usePlayerId, useRules } from '../../../hooks'
import { shineEffect } from '../../../css'
import { useDroppable } from '@dnd-kit/core'
import { isDraggedItem } from '../DraggableMaterial'
import { combineEventListeners } from '../../../utilities'
import { useStocks } from '../../../hooks/useStocks'
import { isMoveToStock } from '../utils/IsMoveToStock'
import { mergeRefs } from 'react-merge-refs'
import { BaseContext } from '../../../locators'
import { useLocators } from '../../../hooks/useLocators'
import { useMaterials } from '../../../hooks/useMaterials'

export type SimpleDropAreaProps<P extends number = number, L extends number = number> = {
  location: Location<P, L>
  onShortClick?: () => void
  onLongClick?: () => void
} & HTMLAttributes<HTMLDivElement>

export const SimpleDropArea = forwardRef<HTMLDivElement, SimpleDropAreaProps>((
  { location, onShortClick, onLongClick, ...props }, ref
) => {
  const locators = useLocators()
  const material = useMaterials()
  const locator = useItemLocator(location.type)
  const stocks = useStocks()
  const rules = useRules<MaterialRules>()
  const play = usePlay<MaterialMove>()
  const player = usePlayerId()
  const legalMoves = useLegalMoves<ItemMove>(move =>
    !!rules && rules.isMoveTrigger(move, move => locator?.isDropLocation(move, location) || isMoveToStock(stocks, move, location))
  )

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

  const draggedItem = isDraggedItem(active?.data.current) ? active?.data.current : undefined

  const context: BaseContext = { game: rules!.game, player, material: material!, locators: locators! }
  const canDrop = draggedItem !== undefined && legalMoves.filter(move =>
    rules?.isMoveTrigger(move, move =>
      locator?.isMoveItemToLocation(move, draggedItem.type, draggedItem.index, location, stocks, context) ?? false
    )
  ).length === 1

  const animations = useAnimations<MaterialMove>(animation => animation.action.playerId === player)

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

  if (locator?.isDragOnlyLocation(location) && !canDrop) return null

  return <div ref={mergeRefs([ref, setNodeRef])}
              css={[
                !draggedItem && (onShortClick || onLongClick) && hoverHighlight, clicking && clickingAnimation,
                (canDrop || (!draggedItem && legalMoves.length > 0 && !animations.length)) && shineEffect,
                canDrop && isOver && dropHighlight
              ]}
              {...props} {...combineEventListeners(listeners, props)}/>
})

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

export function isDropLocation<P extends number = number, L extends number = number>(data?: Record<string, any>): data is Location<P, L> {
  return typeof data?.type === 'number'
}
