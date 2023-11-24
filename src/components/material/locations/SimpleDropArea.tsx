/** @jsxImportSource @emotion/react */
import { useDroppable } from '@dnd-kit/core'
import { css, keyframes } from '@emotion/react'
import { displayLocationHelp, displayMaterialHelp, Location, MaterialMove, MaterialRules, XYCoordinates } from '@gamepark/rules-api'
import { forwardRef, HTMLAttributes, MouseEvent, useMemo, useState } from 'react'
import { mergeRefs } from 'react-merge-refs'
import { LongPressCallbackReason, LongPressEventType, useLongPress } from 'use-long-press'
import { backgroundCss, borderRadiusCss, pointerCursorCss, shineEffect, sizeCss, transformCss } from '../../../css'
import { useAnimations, useLegalMoves, useMaterialContext, usePlay, usePlayerId, useRules } from '../../../hooks'
import { combineEventListeners } from '../../../utilities'
import { dataIsDisplayedItem } from '../DraggableMaterial'

export type SimpleDropAreaProps<P extends number = number, L extends number = number> = {
  location: Location<P, L>
  onShortClick?: () => void
  onLongClick?: () => void
  alwaysVisible?: boolean
} & HTMLAttributes<HTMLDivElement>

export const SimpleDropArea = forwardRef<HTMLDivElement, SimpleDropAreaProps>((
  { location, onShortClick, onLongClick, alwaysVisible, ...props }, ref
) => {
  const context = useMaterialContext()
  const material = context.material
  const locator = context.locators[location.type]
  const description = locator?.getLocationDescription(context)
  const rules = useRules<MaterialRules>()
  const play = usePlay<MaterialMove>()
  const player = usePlayerId()
  const legalMoves = useLegalMoves()
  const disabled = useMemo(() => !legalMoves.some(move => description?.couldDrop(move, location, context)), [legalMoves, location, context])
  const longClickMoves = useMemo(() => legalMoves.filter(move => description?.canLongClick(move, location, context)), [legalMoves, location, context])

  if (!onLongClick && longClickMoves.length === 1) {
    onLongClick = () => play(longClickMoves[0], { delayed: rules?.isUnpredictableMove(longClickMoves[0], player) })
  }

  if (!onShortClick && (locator?.locationDescription?.help || locator?.parentItemType !== undefined)) {
    onShortClick = () => {
      if (locator?.locationDescription?.help) {
        play(displayLocationHelp(location), { local: true })
      } else {
        const itemType = locator!.parentItemType!
        play(displayMaterialHelp(itemType, rules?.material(itemType).getItem(location.parent!), location.parent), { local: true })
      }
    }
  }

  const { isOver, active, setNodeRef } = useDroppable({
    id: JSON.stringify(location),
    disabled,
    data: location
  })

  const draggedItem = dataIsDisplayedItem(active?.data.current) ? active?.data.current : undefined
  const draggedItemContext = useMemo(() => draggedItem ? { ...context, ...draggedItem } : undefined, [draggedItem, context])
  const canDrop = useMemo(() => !!draggedItemContext && !!description && !!material && legalMoves.filter(move =>
      material[draggedItemContext.type]?.canDrag(move, draggedItemContext) && description.canDrop(move, location, draggedItemContext)
    ).length === 1
    , [draggedItemContext, legalMoves, rules])
  const locationContext = useMemo(() => ({ ...context, canDrop }), [context, canDrop])

  const animations = useAnimations<MaterialMove>(animation => animation.action.playerId === player)

  const [clicking, setClicking] = useState(false)

  const listeners = useLongPress(() => {
    if (onLongClick) onLongClick()
    else if (onShortClick) onShortClick()
  }, {
    detect: LongPressEventType.Pointer,
    cancelOnMovement: 5,
    threshold: 600,
    onStart: event => {
      if (onShortClick || onLongClick) {
        setClicking(true)
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
  if (!alwaysVisible && !description.isAlwaysVisible(location, context) && !canDrop) return null

  const { width, height } = description.getSize(location, context)
  const image = description.getImage(location, context)
  const borderRadius = description.getBorderRadius(location, context)

  return (
      <div ref={mergeRefs([ref, setNodeRef])}
                css={[
                  absolute, (onShortClick || onLongClick) && pointerCursorCss,
                  locator?.parentItemType !== undefined && positionOnParentCss(locator.getPositionOnParent(location, context)),
                  transformCss(...description.transformLocation(location, locationContext)),
                  sizeCss(width, height), image && backgroundCss(image), borderRadius && borderRadiusCss(borderRadius),
                  description.getExtraCss(location, locationContext),
                  !draggedItem && (onShortClick || onLongClick) && hoverHighlight, clicking && clickingAnimation,
                  ((canDrop && !isOver) || (!draggedItem && longClickMoves.length && !animations.length)) && shineEffect,
                  canDrop && isOver && dropHighlight
                ]}
                {...props} {...combineEventListeners(listeners, props)}>
        {description.content && <description.content location={location} />}
      </div>
  )
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
