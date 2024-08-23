/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { MaterialItem } from '@gamepark/rules-api'
import isEqual from 'lodash/isEqual'
import { forwardRef, MouseEvent, useMemo, useRef } from 'react'
import { mergeRefs } from 'react-merge-refs'
import { LongPressCallbackReason, LongPressEventType, useLongPress } from 'use-long-press'
import { useDraggedItem, useMaterialContext, usePlay } from '../../../hooks'
import { LocationFocusRef, useExpectedDropLocations, useItemLocations } from '../../../hooks/useItemLocations'
import { combineEventListeners } from '../../../utilities'
import { ComponentSize } from '../ComponentDescription'
import { LocationsMask } from '../locations'
import { MaterialComponent, MaterialComponentProps } from '../MaterialComponent'
import { isLocationSubset } from '../utils'
import { useFocusContext } from './focus'

type ItemDisplayProps = MaterialComponentProps & {
  index: number
  displayIndex: number
  item: MaterialItem
  draggingTransform?: string
  animating?: boolean
  isFocused?: boolean
  onShortClick?: () => void
  onLongClick?: () => void
}

export const ItemDisplay = forwardRef<HTMLDivElement, ItemDisplayProps>((
  { type, index, displayIndex, item, draggingTransform, animating, isFocused, onShortClick, onLongClick, highlight, playDown, ...props }: ItemDisplayProps, ref
) => {
  const context = useMaterialContext()
  const { focus, focusRef } = useFocusContext()
  const itemContext = useMemo(() => ({ ...context, type, index, displayIndex }), [context])
  const locations = useItemLocations(item, itemContext)
  const focusedLocations = useMemo(() => locations.filter(l => l.focusRef).map(l => l.location), [locations])
  const description = context.material[type]!
  const itemTransform = useMemo(() => description.getItemTransform(item, itemContext), [description, item, itemContext])
  const transformStyle = (draggingTransform ? [draggingTransform, ...itemTransform] : itemTransform).join(' ')
  const hoverTransform = useMemo(() => description.getHoverTransform(item, itemContext).join(' '), [description, item, itemContext])

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

  const canHaveChildren = useMemo(() => Object.values(context.locators).some(locator => locator?.parentItemType === type), [context, type])

  return <div css={hoverTransform && hoverCss(itemTransform.join(' '), description.getSize(item.id), hoverTransform, animating || !!draggingTransform)}
              {...props} {...combineEventListeners(listeners, props)}>
    <MaterialComponent ref={isFocused ? mergeRefs([ref, focusRef]) : ref}
                       type={type} itemId={item.id}
                       highlight={highlight}
                       playDown={playDown ?? (focus?.highlight && !isFocused && !focusedLocations.length)}
                       style={{ transform: transformStyle }}
                       css={description.getItemExtraCss(item, itemContext)}>
      {focusedLocations.length > 0 && <LocationsMask locations={focusedLocations}/>}
      {canHaveChildren ? <ItemDropLocations locations={locations} item={item} type={type}/> : <ItemLocations locations={locations}/>}
    </MaterialComponent>
  </div>
})

const hoverCss = (itemTransform: string, itemSize: ComponentSize, hoverTransform: string, disable: boolean) => css`
  &:hover > * > * {
    transition: transform 50ms ease-in-out;
    transform: ${disable ? '' : hoverTransform};
  }
  
  > * {
    position: absolute;
    pointer-events: ${disable ? 'auto' : 'none'};
  }

  &:before {
    content: " ";
    position: absolute;
    width: ${itemSize.width}em;
    height: ${itemSize.height}em;
    transform: ${itemTransform};
  }
`

ItemDisplay.displayName = 'ItemDisplay'

type ItemLocationsProps = {
  locations: LocationFocusRef[]
}

const ItemLocations = ({ locations }: ItemLocationsProps) => {
  const context = useMaterialContext()
  return <>
    {locations.map(({ location, focusRef }) => {
      const description = context.locators[location.type]?.getLocationDescription(location, context)
      const LocationComponent = description?.Component
      if (!LocationComponent) return null
      return <LocationComponent key={JSON.stringify(location)} location={location} description={description} ref={focusRef}/>
    })}
  </>
}

const ItemDropLocations = ({ locations, item, type }: ItemLocationsProps & { item: MaterialItem, type: number }) => {
  const context = useMaterialContext()
  const draggedItem = useDraggedItem()
  const draggedItemContext = { ...context, ...draggedItem }
  const expectedDropLocations = useExpectedDropLocations()
  const allLocations = useMemo(() => {
    const result = [...locations]
    for (const location of expectedDropLocations) {
      const locator = context.locators[location.type]
      if (locator?.parentItemType === type && isEqual(locator.getParentItem(location, context), item) && !result.some(r => isLocationSubset(location, r.location))) {
        result.push({ location })
      }
    }
    return result
  }, [locations, expectedDropLocations])


  return <>
    {allLocations.map(({ location, focusRef }) => {
      const description = context.locators[location.type]?.getLocationDescription(location, draggedItemContext)
      const LocationComponent = description?.Component
      if (!LocationComponent) return null
      return <LocationComponent key={JSON.stringify(location)} location={location} description={description} ref={focusRef}/>
    })}
  </>
}