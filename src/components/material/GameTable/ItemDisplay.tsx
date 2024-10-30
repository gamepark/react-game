/** @jsxImportSource @emotion/react */
import { css, Interpolation, Theme } from '@emotion/react'
import { MaterialItem } from '@gamepark/rules-api'
import isEqual from 'lodash/isEqual'
import partition from 'lodash/partition'
import { forwardRef, MouseEvent, useMemo, useRef } from 'react'
import { mergeRefs } from 'react-merge-refs'
import { LongPressCallbackReason, LongPressEventType, useLongPress } from 'use-long-press'
import { useDraggedItem, useLegalMoves, useMaterialContext, usePlay } from '../../../hooks'
import { LocationFocusRef, useExpectedDropLocations, useItemLocations } from '../../../hooks/useItemLocations'
import { combineEventListeners } from '../../../utilities'
import { removeRotations } from '../animations/rotations.utils'
import { ComponentSize } from '../ComponentDescription'
import { LocationsMask } from '../locations'
import { MaterialComponent, MaterialComponentProps } from '../MaterialComponent'
import { isLocationSubset } from '../utils'
import { useFocusContext } from './focus'

type ItemDisplayProps = MaterialComponentProps & {
  index: number
  displayIndex: number
  item: MaterialItem
  dragTransform?: string
  animation?: Interpolation<Theme>
  isFocused?: boolean
  onShortClick?: () => void
  onLongClick?: () => void
}

export const ItemDisplay = forwardRef<HTMLDivElement, ItemDisplayProps>((
  { type, index, displayIndex, item, dragTransform, animation, isFocused, onShortClick, onLongClick, highlight, playDown, ...props }: ItemDisplayProps, ref
) => {
  const context = useMaterialContext()
  const legalMoves = useLegalMoves()
  const { focus, focusRef } = useFocusContext()
  const itemContext = useMemo(() => ({ ...context, type, index, displayIndex, dragTransform }), [context, type, index, displayIndex, dragTransform])
  const locations = useItemLocations(item, itemContext)
  const [focusedLocations, otherLocations] = useMemo(() => partition(locations, l => l.focusRef), [locations])
  const description = context.material[type]!
  const itemTransform = useMemo(() => description.getItemTransform(item, itemContext), [description, item, itemContext])
  const transformStyle = (dragTransform ? [dragTransform, ...itemTransform] : itemTransform).join(' ')
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

  const menu = description.getItemMenu(item, itemContext, legalMoves)

  return <>
    <div css={[
      itemCss, animation,
      hoverTransform && hoverCss(itemTransform.join(' '), description.getSize(item.id), hoverTransform, !!animation || !!dragTransform)
    ]} {...props} {...combineEventListeners(listeners, props)}>
      <MaterialComponent ref={isFocused ? mergeRefs([ref, focusRef]) : ref}
                         itemIndex={index}
                         type={type} itemId={item.id}
                         highlight={highlight}
                         playDown={playDown ?? (focus?.highlight && !isFocused && !focusedLocations.length)}
                         style={{ transform: transformStyle }}
                         css={description.getItemExtraCss(item, itemContext)}>
        {canHaveChildren ? <ItemDropLocations locations={otherLocations} item={item} type={type}/> : <ItemLocations locations={otherLocations}/>}
        {focusedLocations.length > 0 && <LocationsMask locations={focusedLocations.map(l => l.location)} borderRadius={description.getBorderRadius(item.id)}/>}
        <ItemLocations locations={focusedLocations}/>
      </MaterialComponent>
    </div>
    {menu && <div style={{ position: 'absolute', transform: removeRotations(itemTransform).join(' ') + ' translateZ(15em)' }} {...props}>
      {menu}
    </div>
    }
  </>
})

const itemCss = css`
  > * {
    position: absolute;
  }
`

const hoverCss = (itemTransform: string, itemSize: ComponentSize, hoverTransform: string, disable: boolean) => css`
  @media (hover) {
    &:hover > * > * {
      transition: transform 50ms ease-in-out;
      transform: ${disable ? '' : hoverTransform};
    }
  }

  > * {
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