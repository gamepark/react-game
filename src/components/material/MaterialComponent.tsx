/** @jsxImportSource @emotion/react */
import { forwardRef, HTMLAttributes, MouseEvent } from 'react'
import { MaterialGame, MaterialMove } from '@gamepark/rules-api'
import { LongPressCallbackReason, LongPressEventType, useLongPress } from 'use-long-press'
import { combineEventListeners } from '../../utilities'
import { useGame, useMaterialDescription } from '../../hooks'
import { FlatMaterial, isFlatMaterialDescription } from './FlatMaterial'
import { ComponentCommonProps } from './MaterialDescription'

export type MaterialComponentProps<ItemId = any, P extends number = number, M extends number = number, L extends number = number> = {
  type: M
  itemId?: ItemId
  legalMovesTo?: MaterialMove<P, M, L>[]
  onShortClick?: () => void
  onLongClick?: () => void
} & ComponentCommonProps & HTMLAttributes<HTMLElement>

export const MaterialComponent = forwardRef<HTMLDivElement, MaterialComponentProps>((
  { type, itemId, legalMovesTo, onShortClick, onLongClick = onShortClick, ...props }, ref
) => {
  const game = useGame<MaterialGame>()
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

  if (!description || !game) return null

  if (isFlatMaterialDescription(description)) {
    return (
      <FlatMaterial ref={ref} {...description.getFlatMaterialProps(itemId)} {...props} {...combineEventListeners(listeners, props)}/>
    )
  }

  return null
})
