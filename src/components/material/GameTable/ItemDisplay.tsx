/** @jsxImportSource @emotion/react */
import { MaterialItem } from '@gamepark/rules-api'
import { forwardRef } from 'react'
import { mergeRefs } from 'react-merge-refs'
import { pointerCursorCss, transformCss } from '../../../css'
import { useMaterialContext } from '../../../hooks'
import { centerLocator, ItemContext } from '../../../locators'
import { LocationsMask, SimpleDropArea } from '../locations'
import { MaterialComponent, MaterialComponentProps } from '../MaterialComponent'
import { getInnerLocations, useFocusContext } from './focus'

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
  const innerLocations = getInnerLocations(item, itemContext, focus)
  const locator = context.locators[item.location.type] ?? centerLocator
  return <MaterialComponent ref={mergeRefs([ref, isFocused ? addFocusRef : undefined])}
                            type={type} itemId={item.id}
                            playDown={focus && !isFocused && !innerLocations.some(location => location.focus)}
                            css={[pointerCursorCss, transformCss(...locator.transformItem(item, itemContext))]}
                            {...props}>
    <LocationsMask locations={innerLocations.filter(l => l.focus).map(l => l.location)}/>
    {innerLocations.map(({ focus, location }) =>
      <SimpleDropArea key={JSON.stringify(location)} location={location} alwaysVisible={focus} ref={focus ? addFocusRef : undefined}/>
    )}
  </MaterialComponent>
})

ItemDisplay.displayName = 'ItemDisplay'
