/** @jsxImportSource @emotion/react */
import { MaterialItem } from '@gamepark/rules-api'
import { forwardRef, useMemo } from 'react'
import { mergeRefs } from 'react-merge-refs'
import { pointerCursorCss, transformCss } from '../../../css'
import { useMaterialContext } from '../../../hooks'
import { ItemContext } from '../../../locators'
import { LocationsMask } from '../locations'
import { MaterialComponent, MaterialComponentProps } from '../MaterialComponent'
import { getLocationsWithFocus, useFocusContext } from './focus'

type ItemDisplayProps = MaterialComponentProps & {
  index: number
  displayIndex: number
  item: MaterialItem
  isFocused?: boolean
}

export const ItemDisplay = forwardRef<HTMLDivElement, ItemDisplayProps>((
  { type, index, displayIndex, item, isFocused, ...props }: ItemDisplayProps, ref
) => {
  const context = useMaterialContext()
  const { focus, addFocusRef } = useFocusContext()
  const itemContext: ItemContext = { ...context, type, index, displayIndex }
  const { locations, focusedIndexes } = getLocationsWithFocus(item, itemContext, focus)
  const focusedLocations = useMemo(() => focusedIndexes.map(index => locations[index]), [locations, focusedIndexes])
  const description = context.material[type]
  if (!description) return null
  return <MaterialComponent ref={isFocused ? mergeRefs([ref, addFocusRef]) : ref}
                            type={type} itemId={item.id}
                            playDown={focus?.highlight && !isFocused && !focusedIndexes.length}
                            css={[pointerCursorCss, transformCss(...description.getItemTransform(item, itemContext)), description.getItemExtraCss(item, itemContext)]}
                            {...props}>
    {locations.length > 0 && <>
      {focusedLocations.length > 0 && <LocationsMask locations={focusedLocations}/>}
      {locations.map((location, index) => {
        const LocationComponent = context.locators[location.type]?.getLocationDescription(context)?.Component
        if (!LocationComponent) return null
        const hasFocus = focusedIndexes.includes(index)
        return <LocationComponent key={JSON.stringify(location)} location={location} ref={hasFocus ? addFocusRef : undefined}/>
      })}
    </>}
  </MaterialComponent>
})

ItemDisplay.displayName = 'ItemDisplay'
