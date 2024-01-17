/** @jsxImportSource @emotion/react */
import { css, Interpolation, Theme } from '@emotion/react'
import { forwardRef, HTMLAttributes, MouseEvent, useMemo } from 'react'
import { LongPressCallbackReason, LongPressEventType, useLongPress } from 'use-long-press'
import { sizeCss } from '../../css'
import { useMaterialContext, useMaterialDescription } from '../../hooks'
import { combineEventListeners } from '../../utilities'

export type MaterialComponentProps<M extends number = number, ItemId = any> = {
  type: M
  itemId?: ItemId
  onShortClick?: () => void
  onLongClick?: () => void
  highlight?: boolean
  playDown?: boolean
  css?: Interpolation<Theme>
} & HTMLAttributes<HTMLElement>

export const MaterialComponent = forwardRef<HTMLDivElement, MaterialComponentProps>((
  { type, itemId, onShortClick, onLongClick, highlight, playDown, css , ...props }, ref
) => {
  const description = useMaterialDescription(type)
  const context = useMaterialContext()

  const listeners = useLongPress(() => onLongClick && onLongClick(), {
    detect: LongPressEventType.Pointer,
    cancelOnMovement: 5,
    threshold: 600,
    onCancel: (_, { reason }) => {
      if (reason === LongPressCallbackReason.CancelledByRelease) {
        setTimeout(() => onShortClick && onShortClick())
      }
    },
    filterEvents: event => !(event as MouseEvent).button // Ignore clicks on mouse buttons > 0
  })()

  if (!description) return null

  const { width, height } = description.getSize(itemId, context)

  const componentCss = useMemo(() => [materialCss, sizeCss(width, height), css], [width, height, css])

  return (
    <div ref={ref} css={componentCss} {...props} {...combineEventListeners(listeners, props)}>
      {description.content({ itemId, context, highlight, playDown, ...props })}
    </div>
  )
})

const materialCss = css`
  transform-style: preserve-3d;
  -webkit-tap-highlight-color: transparent;
`
