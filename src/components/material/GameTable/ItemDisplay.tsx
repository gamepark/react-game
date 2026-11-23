import { css, Interpolation, Theme } from '@emotion/react'
import { Location, MaterialItem } from '@gamepark/rules-api'
import { isEqual } from 'es-toolkit'
import { partition } from 'es-toolkit/compat'
import { forwardRef, MouseEvent, useMemo, useRef } from 'react'
import { mergeRefs } from 'react-merge-refs'
import { LongPressCallbackReason, LongPressEventType, useLongPress } from 'use-long-press'
import { pointerCursorCss } from '../../../css'
import { useDraggedItem, useMaterialContextRef, usePlay } from '../../../hooks'
import { LocationFocusRef, useExpectedDropLocations, useItemLocations } from '../../../hooks/useItemLocations'
import { ParentFace } from '../../../locators'
import { combineEventListeners } from '../../../utilities'
import { toSingleRotation } from '../animations'
import { ComponentSize } from '../ComponentDescription'
import { LocationsMask } from '../locations'
import { MaterialComponent, MaterialComponentProps } from '../MaterialComponent'
import { isLocationSubset } from '../utils'
import { useFocusContext } from './focus'
import { useHoveredItems } from './HoveredItem'

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
  const context = useMaterialContextRef()
  const { focus, focusRef } = useFocusContext()
  const isDragging = !!dragTransform
  const elementRef = useRef<HTMLDivElement>(null)
  const { hovered, listeners: hoverListeners } = useHoveredItems(type, index, item, elementRef)
  const itemContext = useMemo(() => ({ ...context, type, index, displayIndex, isDragging, hovered }), [context, type, index, displayIndex, isDragging, hovered])
  const locations = useItemLocations(item, itemContext)
  const [focusedLocations, otherLocations] = useMemo(() => partition(locations, l => l.focusRef), [locations])
  const description = context.material[type]!
  const itemTransform = useMemo(() => {
    const transform = description.getItemTransform(item, itemContext)
    // While dragging, normalize rotations so that a dropped item's "to-only" animation keyframe
    // (which is also built from toSingleRotation) interpolates component-by-component, instead of
    // falling back to matrix decomposition between mismatched transform lists (which produces a
    // circular trajectory when the origin location has a rotated parent + an inverse rotation).
    return isDragging ? toSingleRotation(transform) : transform
  }, [description, item, itemContext, isDragging])
  const transformStyle = (dragTransform ? [dragTransform, ...itemTransform] : itemTransform).join(' ')
  const hoverTransform = useMemo(() => description.getHoverTransform(item, itemContext).join(' '), [description, item, itemContext])

  const play = usePlay()

  const displayHelpMove = description.displayHelp(item, itemContext)
  const displayHelp = displayHelpMove ? () => play(displayHelpMove, { transient: true }) : undefined

  onLongClick = onLongClick ?? (onShortClick ? displayHelp : undefined)
  onShortClick = onShortClick ?? displayHelp

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
        if (onShortClick) {
          setTimeout(onShortClick)
        }
      }
    },
    filterEvents: event => !(event as MouseEvent).button // Ignore clicks on mouse buttons > 0
  })()
  const pointerListeners = { ...hoverListeners, ...combineEventListeners(listeners, hoverListeners) }
  const materialRef = useMemo(() => mergeRefs(isFocused ? [ref, focusRef, elementRef] : [ref, elementRef]), [ref, focusRef, isFocused])

  const canHaveChildren = useMemo(() => Object.values(context.locators).some(locator => locator?.parentItemType === type), [context, type])
  /**
   * An item that carries its hover to the items placed on it (see MaterialDescription.hoverCarriesChildren and
   * ItemContext.hovered): its hover is kept in JavaScript rather than in CSS, so that it stays while the pointer is on
   * one of those items, which are not inside its element.
   */
  const carriesHover = description.hoverCarriesChildren && canHaveChildren && !!hoverTransform
  const isHovered = carriesHover && !!hovered?.some(h => h.type === type && h.index === index && isEqual(h.item, item))

  /**
   * Each face of the item carries the locations that belong to it: what a location is printed on is the locator's
   * to say, and a location that belongs to the item rather than to one of its faces follows the one that is up
   * (see {@link Locator.getParentFace}). A location left on a face that is turned away is out of reach, which is
   * what a spot printed on the front of a card has to be while the card shows its back.
   */
  const isOnFace = useMemo(() => {
    const faceUp = description.isFlippedOnTable(item, itemContext) ? ParentFace.Back : ParentFace.Front
    return (location: Location, face: ParentFace) => {
      const parentFace = context.locators[location.type]?.getParentFace(location, context) ?? ParentFace.Front
      return (parentFace === ParentFace.Up ? faceUp : parentFace) === face
    }
  }, [context, description, item, itemContext])

  const faceContent = (face: ParentFace) => {
    const others = otherLocations.filter(({ location }) => isOnFace(location, face))
    const focused = focusedLocations.filter(({ location }) => isOnFace(location, face))
    return <>
      {canHaveChildren
        ? <ItemDropLocations locations={others} item={item} type={type} keepLocation={location => isOnFace(location, face)}/>
        : <ItemLocations locations={others}/>}
      {focused.length > 0 && <LocationsMask locations={focused.map(l => l.location)} borderRadius={description.getBorderRadius(item.id)}/>}
      <ItemLocations locations={focused}/>
    </>
  }

  return <>
    <div css={[
      itemCss, animation,
      hoverTransform && (carriesHover
        ? carriedHoverCss(itemTransform.join(' '), description.getSize(item.id), isHovered && !animation && !isDragging ? hoverTransform : undefined)
        : hoverCss(itemTransform.join(' '), description.getSize(item.id), hoverTransform, !!animation || isDragging)),
      (onShortClick || onLongClick) && pointerCursorCss
    ]} {...props} {...combineEventListeners(pointerListeners, props)}>
      <MaterialComponent ref={materialRef}
                         itemIndex={index}
                         displayIndex={displayIndex}
                         type={type} itemId={item.id}
                         highlight={highlight}
                         playDown={playDown ?? (focus?.highlight && !isFocused && !focusedLocations.length)}
                         backChildren={faceContent(ParentFace.Back)}
                         style={{ transform: transformStyle }}
                         data-rest-transform={dragTransform ? itemTransform.join(' ') : undefined}
                         css={description.getItemExtraCss(item, itemContext)}>
        {faceContent(ParentFace.Front)}
      </MaterialComponent>
    </div>
  </>
})

const itemCss = css`
  > * {
    position: absolute;
  }
`

/**
 * `> * > *` is the wrapper MaterialComponent puts around the content of an item, and not the item itself, on
 * purpose: an item that is neither dragged nor animating wears a `transition: transform 0.2s` (see the
 * transformTransition of DraggableMaterial), so a hover applied to it would trail behind the pointer. The wrapper
 * exists for this and carries no transition, so it snaps.
 *
 * Above the faces rather than on them: a face carries a transform of its own, the rotateY(-180deg) of the back of
 * a card or the 6 sides of a die, and a transform set here would replace it instead of adding to it.
 */
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

/**
 * The hover of an item that carries it to the items placed on it: the transform is applied while the item, or an item
 * placed on it, is hovered (see {@link useHoveredItems}). The items placed on it get the same transform in their own,
 * and their transform eases in 0.2s (transformTransition of DraggableMaterial): the item eases at the same pace, so that
 * they move together.
 */
const carriedHoverCss = (itemTransform: string, itemSize: ComponentSize, hoverTransform?: string) => css`
  > * > * {
    transition: transform 0.2s ease-in-out;
    ${hoverTransform ? `transform: ${hoverTransform};` : ''}
  }

  /* At rest, only its place is hovered; hovered, the whole item as it is shown, so that it does not shrink under the pointer */
  > * {
    pointer-events: ${hoverTransform ? 'auto' : 'none'};
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
  const context = useMaterialContextRef()
  return <>
    {locations.map(({ location, focusRef }) => {
      const description = context.locators[location.type]?.getLocationDescription(location, context)
      const LocationComponent = description?.Component
      if (!LocationComponent) return null
      return <LocationComponent key={JSON.stringify(location)} location={location} description={description} ref={focusRef}/>
    })}
  </>
}

const ItemDropLocations = (
  { locations, item, type, keepLocation }: ItemLocationsProps & { item: MaterialItem, type: number, keepLocation: (location: Location) => boolean }
) => {
  const context = useMaterialContextRef()
  const draggedItem = useDraggedItem()
  const draggedItemContext = { ...context, ...draggedItem }
  const expectedDropLocations = useExpectedDropLocations()
  const allLocations = useMemo(() => {
    const result = [...locations]
    for (const location of expectedDropLocations) {
      const locator = context.locators[location.type]
      if (locator?.parentItemType === type && isEqual(locator.getParentItem(location, context), item)
        && keepLocation(location) && !result.some(r => isLocationSubset(location, r.location))) {
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