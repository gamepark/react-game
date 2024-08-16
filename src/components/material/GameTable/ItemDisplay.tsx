/** @jsxImportSource @emotion/react */
import { MaterialItem } from '@gamepark/rules-api'
import { forwardRef, useMemo } from 'react'
import { mergeRefs } from 'react-merge-refs'
import { pointerCursorCss, transformCss } from '../../../css'
import { useMaterialContext } from '../../../hooks'
import { useItemLocations } from '../../../hooks/useItemLocations'
import { ItemContext } from '../../../locators'
import { LocationsMask } from '../locations'
import { MaterialComponent, MaterialComponentProps } from '../MaterialComponent'
import { useFocusContext } from './focus'

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
  const { focus, focusRef } = useFocusContext()
  const itemContext: ItemContext = { ...context, type, index, displayIndex }
  const locations = useItemLocations(item, itemContext)
  const focusedLocations = useMemo(() => locations.filter(l => l.focusRef).map(l => l.location), [locations])
  const description = context.material[type]
  if (!description) return null
  return <MaterialComponent ref={isFocused ? mergeRefs([ref, focusRef]) : ref}
                            type={type} itemId={item.id}
                            playDown={focus?.highlight && !isFocused && !focusedLocations.length}
                            css={[pointerCursorCss, transformCss(...description.getItemTransform(item, itemContext)), description.getItemExtraCss(item, itemContext)]}
                            {...props}>
    {focusedLocations.length > 0 && <LocationsMask locations={focusedLocations}/>}
    {locations.map(({ location, focusRef }) => {
      const LocationComponent = context.locators[location.type]?.getLocationDescription(context)?.Component
      if (!LocationComponent) return null
      return <LocationComponent key={JSON.stringify(location)} location={location} ref={focusRef}/>
    })}
  </MaterialComponent>
})

ItemDisplay.displayName = 'ItemDisplay'
