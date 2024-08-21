/** @jsxImportSource @emotion/react */
import { MaterialItem } from '@gamepark/rules-api'
import { forwardRef, MouseEvent, useMemo, useRef } from 'react'
import { mergeRefs } from 'react-merge-refs'
import { LongPressCallbackReason, LongPressEventType, useLongPress } from 'use-long-press'
import { useDraggedItem, useMaterialContext, usePlay } from '../../../hooks'
import { useItemLocations } from '../../../hooks/useItemLocations'
import { combineEventListeners } from '../../../utilities'
import { LocationsMask } from '../locations'
import { MaterialComponent, MaterialComponentProps } from '../MaterialComponent'
import { useFocusContext } from './focus'

type ItemDisplayProps = MaterialComponentProps & {
  index: number
  displayIndex: number
  item: MaterialItem
  transformStyle: string
  isFocused?: boolean
  onShortClick?: () => void
  onLongClick?: () => void
}

export const ItemDisplay = forwardRef<HTMLDivElement, ItemDisplayProps>((
  { type, index, displayIndex, item, transformStyle, isFocused, onShortClick, onLongClick, highlight, playDown, ...props }: ItemDisplayProps, ref
) => {
  const context = useMaterialContext()
  const { focus, focusRef } = useFocusContext()
  const itemContext = useMemo(() => ({ ...context, type, index, displayIndex }), [context])
  const locations = useItemLocations(item, itemContext)
  const draggedItem = useDraggedItem()
  const draggedItemContext = { ...context, ...draggedItem }
  const focusedLocations = useMemo(() => locations.filter(l => l.focusRef).map(l => l.location), [locations])
  const description = context.material[type]!

  const play = usePlay()
  const displayHelp = useMemo(() => () => play(description.displayHelp(item, itemContext), { local: true }), [description, item, itemContext])
  onLongClick = onLongClick ?? (onShortClick ? displayHelp : undefined)

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
        setTimeout(onShortClick ?? displayHelp)
      }
    },
    filterEvents: event => !(event as MouseEvent).button // Ignore clicks on mouse buttons > 0
  })()


  return <div {...props} {...combineEventListeners(listeners, props)}>
    <MaterialComponent ref={isFocused ? mergeRefs([ref, focusRef]) : ref}
                       type={type} itemId={item.id}
                       highlight={highlight}
                       playDown={playDown ?? (focus?.highlight && !isFocused && !focusedLocations.length)}
                       style={{ transform: transformStyle }}
                       css={description.getItemExtraCss(item, itemContext)}>
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
