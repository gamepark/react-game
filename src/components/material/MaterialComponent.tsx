/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { forwardRef, HTMLAttributes, memo, MouseEvent, useMemo } from 'react'
import { LongPressCallbackReason, LongPressEventType, useLongPress } from 'use-long-press'
import { sizeCss } from '../../css'
import { useMaterialDescription } from '../../hooks'
import { combineEventListeners } from '../../utilities'

export type MaterialComponentProps<M extends number = number, ItemId = any> = {
  type: M
  itemId?: ItemId
  onShortClick?: () => void
  onLongClick?: () => void
  highlight?: boolean
  playDown?: boolean
} & HTMLAttributes<HTMLElement>

export const MaterialComponent = memo(forwardRef<HTMLDivElement, MaterialComponentProps>((
  { type, itemId, onShortClick, onLongClick, highlight, playDown, ...props }, ref
) => {
  const description = useMaterialDescription(type)

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

  const { width, height } = description.getSize(itemId)

  const componentCss = useMemo(() => [materialCss, sizeCss(width, height)], [width, height])

  return (
    <div ref={ref} css={componentCss} {...props} {...combineEventListeners(listeners, props)}>
      {description.content({ itemId, highlight, playDown, ...props })}
    </div>
  )
}))

MaterialComponent.displayName = 'MaterialComponent'

const materialCss = css`
  transform-style: preserve-3d;
  -webkit-tap-highlight-color: transparent;
`
