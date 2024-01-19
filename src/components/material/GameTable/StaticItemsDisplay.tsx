/** @jsxImportSource @emotion/react */
import { displayMaterialHelp } from '@gamepark/rules-api'
import { pointerCursorCss, transformCss } from '../../../css'
import { useMaterialContext, usePlay } from '../../../hooks'
import { centerLocator, ItemContext } from '../../../locators'
import { LocationsMask, SimpleDropArea } from '../locations'
import { MaterialComponent } from '../MaterialComponent'
import { getInnerLocations, isStaticItemFocus, useFocusContext } from './focus'

export const StaticItemsDisplay = () => {
  const context = useMaterialContext()
  const { focus, addFocusRef } = useFocusContext()
  const { material, locators } = context
  const play = usePlay()
  return <>
    {Object.entries(material).map(([stringType, description]) => {
      const type = parseInt(stringType)
      return description?.getStaticItems(context).map((item, index) => {
        const locator = locators[item.location.type] ?? centerLocator
        return [...Array(item.quantity ?? 1)].map((_, displayIndex) => {
          const itemContext: ItemContext = { ...context, type, index, displayIndex }
          const innerLocations = getInnerLocations(item, itemContext, focus)
          const isFocused = isStaticItemFocus(type, item, focus)
          return <MaterialComponent key={`${type}_${index}_${displayIndex}`} type={type} itemId={item.id}
                                    playDown={focus && !isFocused && !innerLocations.some(location => location.focus)}
                                    ref={isFocused ? addFocusRef : undefined}
                                    css={[pointerCursorCss, transformCss(...locator.transformItem(item, itemContext))]}
                                    onShortClick={() => play(displayMaterialHelp(type, item, index, displayIndex), { local: true })}>
            <LocationsMask locations={innerLocations.filter(l => l.focus).map(l => l.location)}/>
            {innerLocations.map(({ focus, location }) =>
              <SimpleDropArea key={JSON.stringify(location)} location={location} alwaysVisible={focus}
                              ref={focus ? addFocusRef : undefined}/>)}
          </MaterialComponent>
        })
      })
    })}
  </>
}