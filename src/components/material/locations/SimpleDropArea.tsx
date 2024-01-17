/** @jsxImportSource @emotion/react */
import { useDroppable } from '@dnd-kit/core'
import { css, keyframes } from '@emotion/react'
import { displayLocationHelp, displayMaterialHelp, Location, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { forwardRef, HTMLAttributes, MouseEvent, useMemo, useState } from 'react'
import { mergeRefs } from 'react-merge-refs'
import { LongPressCallbackReason, LongPressEventType, useLongPress } from 'use-long-press'
import { backgroundCss, borderRadiusCss, pointerCursorCss, shineEffect, sizeCss, transformCss } from '../../../css'
import { useAnimations, useLegalMoves, useMaterialContext, usePlay, usePlayerId } from '../../../hooks'
import { combineEventListeners } from '../../../utilities'
import { dataIsDisplayedItem } from '../DraggableMaterial'

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
  const player = usePlayerId()
  const legalMoves = useLegalMoves()
  const disabled = useMemo(() => !legalMoves.some(move => description?.couldDrop(move, location, context)), [legalMoves, location, context])
  const openRules = useMemo(() => {
    if ((locator?.locationDescription?.help || locator?.parentItemType !== undefined)) {
      if (locator?.locationDescription?.help) {
        return () => play(displayLocationHelp(location), { local: true })
      } else {
        const itemType = locator!.parentItemType!
        return () => play(displayMaterialHelp(itemType, rules?.material(itemType).getItem(location.parent!), location.parent), { local: true })
      }
    }

    return undefined
  }, [locator, rules.game.items, play])


  const [onShortClick, onLongClick, canClickToMove] = useMemo(() => {
    const shortClickMoves = legalMoves.filter(move => description?.canShortClick(move, location, context))
    const longClickMoves = legalMoves.filter(move => description?.canLongClick(move, location, context))

    const onShortClick = (shortClickMoves.length === 1 ? () => play(shortClickMoves[0], { delayed: rules?.isUnpredictableMove(shortClickMoves[0], player) }) : openRules)
    const onLongClick = (shortClickMoves.length === 1) ? openRules : longClickMoves.length === 1 ? () => play(longClickMoves[0], { delayed: rules?.isUnpredictableMove(longClickMoves[0], player) }) : undefined
    return [shortClick? shortClick: onShortClick, longClick? longClick: onLongClick, shortClickMoves.length === 1 || longClickMoves.length === 1]
  }, [legalMoves, location, context, play])

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
    , [draggedItemContext, legalMoves])
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
  const positionOnParent = useMemo(() => locator?.parentItemType !== undefined? locator.getPositionOnParent(location, context): undefined, [location, context, location])
  const descriptionTransformLocation = useMemo(() => transformCss(...description.transformLocation(location, locationContext)), [location, locationContext, description])
  const extraCss = useMemo(() => description.getExtraCss(location, locationContext), [description, location, locationContext])

  const componentCss = useMemo(() => [
    absolute, (onShortClick || onLongClick) && pointerCursorCss,
    positionOnParent && positionOnParentCss(positionOnParent),
    descriptionTransformLocation,
    sizeCss(width, height), image && backgroundCss(image), borderRadius && borderRadiusCss(borderRadius),
    extraCss,
    !draggedItem && (onShortClick || onLongClick) && hoverHighlight, clicking && clickingAnimation,
    ((canDrop && !isOver) || (!draggedItem && canClickToMove && !animations.length)) && shineEffect,
    canDrop && isOver && dropHighlight
  ], [!onShortClick, !onLongClick, positionOnParent?.x, positionOnParent?.y, descriptionTransformLocation, width, height, image, borderRadius, extraCss, draggedItem, clicking, canDrop, isOver, canClickToMove, animations.length])

  return (
      <div ref={mergeRefs([ref, setNodeRef])}
                css={componentCss}
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
