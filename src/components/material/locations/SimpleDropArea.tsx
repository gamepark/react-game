/** @jsxImportSource @emotion/react */
import { forwardRef, HTMLAttributes, MouseEvent, useCallback, useMemo, useState } from 'react'
import { displayLocationRules, ItemMove, ItemMoveType, Location, MaterialMove, MaterialRules, MoveKind, XYCoordinates } from '@gamepark/rules-api'
import { css, keyframes } from '@emotion/react'
import { LongPressCallbackReason, LongPressEventType, useLongPress } from 'use-long-press'
import { useAnimations, useLegalMoves, useMaterialContext, usePlay, usePlayerId, useRules } from '../../../hooks'
import { borderRadiusCss, shineEffect, sizeCss, transformCss } from '../../../css'
import { useDroppable } from '@dnd-kit/core'
import { dataIsDisplayedItem } from '../DraggableMaterial'
import { combineEventListeners } from '../../../utilities'
import { mergeRefs } from 'react-merge-refs'

export type SimpleDropAreaProps<P extends number = number, L extends number = number> = {
  location: Location<P, L>
  onShortClick?: () => void
  onLongClick?: () => void
} & HTMLAttributes<HTMLDivElement>

export const SimpleDropArea = forwardRef<HTMLDivElement, SimpleDropAreaProps>((
  { location, onShortClick, onLongClick, ...props }, ref
) => {
  const context = useMaterialContext()
  const material = context.material
  const locator = context.locators[location.type]
  const description = locator?.locationDescription
  const rules = useRules<MaterialRules>()
  const play = usePlay<MaterialMove>()
  const player = usePlayerId()
  const predicate = useCallback(
    (move) => !!rules && !!description && rules.isMoveTrigger(move, move => description.isMoveToLocation(move, location, context))
    , [rules, locator, context, location])
  const legalMoves = useLegalMoves<ItemMove>(predicate)

  if (!onLongClick && legalMoves.length === 1) {
    onLongClick = () => play(legalMoves[0], { delayed: rules?.isUnpredictableMove(legalMoves[0], player) })
  }

  if (!onShortClick && locator?.locationDescription?.rules) {
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

  const draggedItem = dataIsDisplayedItem(active?.data.current) ? active?.data.current : undefined

  const canDrop = useMemo(() => !!draggedItem && !!description && !!material && legalMoves.filter(move => rules?.isMoveTrigger(move, move =>
      material[draggedItem.type].canDrag(move, { ...context, ...draggedItem }) && description.isMoveToLocation(move, location, context)
    )).length === 1
    , [draggedItem, legalMoves, rules])

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

  if (!description) {
    console.warn('You must provide a LocationDescription to create drop locations with an ItemLocator')
    return null
  }
  if (!description.isAlwaysVisible(location, context) && !canDrop) return null

  const { width, height } = description.getSize(location, context)
  const borderRadius = description.getBorderRadius(location, context)
  const coordinates = description.getCoordinates(location, context)

  return <div ref={mergeRefs([ref, setNodeRef])}
              css={[
                absolute,
                locator.parentItemType !== undefined && positionOnParentCss(locator.getPositionOnParent(location, context)),
                transformCss(
                  'translate(-50%, -50%)',
                  coordinates && `translate3d(${coordinates.x}em, ${coordinates.y}em, ${coordinates.z}em)`,
                  description.getRotation && `rotate(${description.getRotation(location, context)}${description.rotationUnit})`
                ),
                sizeCss(width, height), borderRadius && borderRadiusCss(borderRadius),
                description.getExtraCss(location, context),
                !draggedItem && (onShortClick || onLongClick) && hoverHighlight, clicking && clickingAnimation,
                ((canDrop && !isOver) || (!draggedItem && legalMoves.length > 0 && !animations.length)) && shineEffect,
                canDrop && isOver && dropHighlight
              ]}
              {...props} {...combineEventListeners(listeners, props)}/>
})

const absolute = css`
  position: absolute;
`

const positionOnParentCss = ({ x, y }: XYCoordinates) => css`
  left: ${x}%;
  top: ${y}%;
`

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
