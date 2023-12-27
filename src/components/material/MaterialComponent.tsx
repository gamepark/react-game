/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { MaterialGame } from '@gamepark/rules-api'
import { forwardRef, HTMLAttributes, MouseEvent } from 'react'
import { LongPressCallbackReason, LongPressEventType, useLongPress } from 'use-long-press'
import { sizeCss } from '../../css'
import { useGame, useMaterialContext, useMaterialDescription } from '../../hooks'
import { combineEventListeners } from '../../utilities'

export type MaterialComponentProps<M extends number = number, ItemId = any> = {
  type: M
  itemId?: ItemId
  onShortClick?: () => void
  onLongClick?: () => void
  highlight?: boolean
  playDown?: boolean
} & HTMLAttributes<HTMLElement>

export const MaterialComponent = forwardRef<HTMLDivElement, MaterialComponentProps>((
  { type, itemId, onShortClick, onLongClick, highlight, playDown, ...props }, ref
) => {
  const game = useGame<MaterialGame>()
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

  if (!description || !game) return null

  const { width, height } = description.getSize(itemId, context)

  return (
    <div ref={ref} css={[materialCss, sizeCss(width, height)]} {...props} {...combineEventListeners(listeners, props)}>
      {description.content({ itemId, context, highlight, playDown, ...props })}
    </div>
  )
})

const materialCss = css`
  transform-style: preserve-3d;
  -webkit-tap-highlight-color: transparent;
`
