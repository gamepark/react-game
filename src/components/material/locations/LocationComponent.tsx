/** @jsxImportSource @emotion/react */
import { css, keyframes, Theme } from '@emotion/react'
import { MaterialMove, MaterialMoveBuilder } from '@gamepark/rules-api'
import { forwardRef, MouseEvent, useMemo, useRef, useState } from 'react'
import { LongPressCallbackReason, LongPressEventType, useLongPress } from 'use-long-press'
import { shineEffect } from '../../../css'
import { useMaterialContext, usePlay } from '../../../hooks'
import { combineEventListeners } from '../../../utilities'
import { LocationDisplay, LocationDisplayProps } from './LocationDisplay'
import displayLocationHelp = MaterialMoveBuilder.displayLocationHelp

export type LocationComponentProps<P extends number = number, M extends number = number, L extends number = number> = LocationDisplayProps<P, M, L> & {
  highlight?: boolean
  onShortClick?: () => void
  onLongClick?: () => void
}

export const LocationComponent = forwardRef<HTMLDivElement, LocationComponentProps>((
  { location, description, highlight, onShortClick, onLongClick, ...props }, ref
) => {
  const context = useMaterialContext()
  const material = context.material
  const locator = context.locators[location.type]
  const rules = context.rules
  const play = usePlay<MaterialMove>()

  const displayHelp = useMemo(() => {
    if (description.help) {
      return () => play(displayLocationHelp(location), { local: true })
    }
    const itemType = locator?.parentItemType
    if (itemType === undefined) return
    const item = rules.material(itemType).getItem(location.parent!)!
    if (!item) return
    return () => play(material[itemType]!.displayHelp(item, { ...context, type: itemType, index: location.parent!, displayIndex: 0 }), { local: true })
  }, [context])
  onLongClick = onLongClick ?? (onShortClick ? displayHelp : undefined)
  onShortClick = onShortClick ?? displayHelp

  const [clicking, setClicking] = useState(false)
  const lastShortClick = useRef(new Date().getTime())
  const listeners = useLongPress(() => onLongClick && onLongClick(), {
    detect: LongPressEventType.Pointer,
    cancelOnMovement: 5,
    threshold: 600,
    onStart: event => {
      setClicking(true)
      event.stopPropagation()
    },
    onFinish: () => setClicking(false),
    onCancel: (_, { reason }) => {
      if (reason === LongPressCallbackReason.CancelledByRelease && onShortClick) {
        const time = new Date().getTime()
        if (time - lastShortClick.current < 300) return
        lastShortClick.current = time
        setTimeout(onShortClick)
      }
    },
    filterEvents: event => !(event as MouseEvent).button // Ignore clicks on mouse buttons > 0
  })()

  highlight = highlight || description.highlight?.(location, context)

  return (
    <LocationDisplay ref={ref} location={location} description={description}
                     css={[
                       (onShortClick || onLongClick) && hoverHighlight,
                       onLongClick && clicking && clickingAnimation,
                       highlight && shineEffect
                     ]}
                     {...props} {...combineEventListeners(listeners, props)}/>
  )
})

const hoverHighlight = css`
  cursor: pointer;

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

LocationComponent.displayName = 'LocationComponent'
