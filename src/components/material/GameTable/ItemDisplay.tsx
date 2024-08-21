/** @jsxImportSource @emotion/react */
import { Interpolation, Theme } from '@emotion/react'
import { MaterialItem } from '@gamepark/rules-api'
import { forwardRef, MouseEvent, useMemo, useRef } from 'react'
import { mergeRefs } from 'react-merge-refs'
import { LongPressCallbackReason, LongPressEventType, useLongPress } from 'use-long-press'
import { pointerCursorCss, transformCss } from '../../../css'
import { useDraggedItem, useMaterialContext } from '../../../hooks'
import { useItemLocations } from '../../../hooks/useItemLocations'
import { ItemContext } from '../../../locators'
import { combineEventListeners } from '../../../utilities'
import { LocationsMask } from '../locations'
import { MaterialComponent, MaterialComponentProps } from '../MaterialComponent'
import { useFocusContext } from './focus'

type ItemDisplayProps = MaterialComponentProps & {
  index: number
  displayIndex: number
  item: MaterialItem
  isFocused?: boolean
  onShortClick?: () => void
  onLongClick?: () => void
  wrapperCss?: Interpolation<Theme>
}

export const ItemDisplay = forwardRef<HTMLDivElement, ItemDisplayProps>((
  { type, index, displayIndex, item, isFocused, onShortClick, onLongClick, wrapperCss, ...props }: ItemDisplayProps, ref
) => {
  const context = useMaterialContext()
  const { focus, focusRef } = useFocusContext()
  const itemContext: ItemContext = { ...context, type, index, displayIndex }
  const locations = useItemLocations(item, itemContext)
  const draggedItem = useDraggedItem()
  const draggedItemContext = { ...context, ...draggedItem }
  const focusedLocations = useMemo(() => locations.filter(l => l.focusRef).map(l => l.location), [locations])
  const description = context.material[type]

  const lastShortClick = useRef(new Date().getTime())
  const listeners = useLongPress(() => onLongClick && onLongClick(), {
    detect: LongPressEventType.Pointer,
    cancelOnMovement: 5,
    threshold: 600,
    onCancel: (_, { reason }) => {
      if (reason === LongPressCallbackReason.CancelledByRelease) {
        const time = new Date().getTime()
        if (time - lastShortClick.current < 300) return
        lastShortClick.current = time
        setTimeout(() => onShortClick && onShortClick())
      }
    },
    filterEvents: event => !(event as MouseEvent).button // Ignore clicks on mouse buttons > 0
  })()


  if (!description) return null
  return <div css={wrapperCss}>
    <MaterialComponent ref={isFocused ? mergeRefs([ref, focusRef]) : ref}
                       type={type} itemId={item.id}
                       playDown={focus?.highlight && !isFocused && !focusedLocations.length}
                       css={[pointerCursorCss, transformCss(...description.getItemTransform(item, itemContext)), description.getItemExtraCss(item, itemContext)]}
                       {...props} {...combineEventListeners(listeners, props)}>
      {focusedLocations.length > 0 && <LocationsMask locations={focusedLocations}/>}
      {locations.map(({ location, focusRef }) => {
        const description = context.locators[location.type]?.getLocationDescription(location, draggedItemContext)
        const LocationComponent = description?.Component
        if (!LocationComponent) return null
        return <LocationComponent key={JSON.stringify(location)} location={location} description={description} ref={focusRef}/>
      })}
    </MaterialComponent>
  </div>
})

ItemDisplay.displayName = 'ItemDisplay'
