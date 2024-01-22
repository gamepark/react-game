/** @jsxImportSource @emotion/react */
import { MaterialItem } from '@gamepark/rules-api'
import { forwardRef, useMemo } from 'react'
import { mergeRefs } from 'react-merge-refs'
import { pointerCursorCss, transformCss } from '../../../css'
import { useMaterialContext } from '../../../hooks'
import { centerLocator, ItemContext } from '../../../locators'
import { LocationsMask, SimpleDropArea } from '../locations'
import { MaterialComponent, MaterialComponentProps } from '../MaterialComponent'
import { getLocationsWithFocus, useFocusContext } from './focus'

type ItemDisplayProps = MaterialComponentProps & {
  index: number
  displayIndex: number
  item: MaterialItem
  isFocused: boolean
}

export const ItemDisplay = forwardRef<HTMLDivElement, ItemDisplayProps>((
  { type, index, displayIndex, item, isFocused, ...props }: ItemDisplayProps, ref
) => {
  const context = useMaterialContext()
  const { focus, addFocusRef } = useFocusContext()
  const itemContext: ItemContext = { ...context, type, index, displayIndex }
  const { locations, focusedIndexes } = getLocationsWithFocus(item, itemContext, focus)
  const focusedLocations = useMemo(() => focusedIndexes.map(index => locations[index]), [locations, focusedIndexes])
  const locator = context.locators[item.location.type] ?? centerLocator
  return <MaterialComponent ref={mergeRefs([ref, isFocused ? addFocusRef : undefined])}
                            type={type} itemId={item.id}
                            playDown={focus && !isFocused && !focusedIndexes.length}
                            css={[pointerCursorCss, transformCss(...locator.transformItem(item, itemContext))]}
                            {...props}>
    {focusedLocations.length > 0 && <LocationsMask locations={focusedLocations}/>}
    {locations.map((location, index) => {
        const hasFocus = focusedIndexes.includes(index)
        return <SimpleDropArea key={JSON.stringify(location)} location={location} alwaysVisible={hasFocus} ref={hasFocus ? addFocusRef : undefined}/>
      }
    )}
  </MaterialComponent>
})

ItemDisplay.displayName = 'ItemDisplay'
