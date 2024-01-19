import { useTranslation } from 'react-i18next'
import { MaterialItem } from '../../../../../workshop/packages/rules-api'
import { useMaterialContext } from '../../../hooks'
import { ItemContext } from '../../../locators'
import { DraggableMaterial } from '../DraggableMaterial'
import { LocationsMask, SimpleDropArea } from '../locations'
import { getInnerLocations, isItemFocus, useFocusContext } from './focus'

export const DynamicItemsDisplay = () => {
  const context = useMaterialContext()
  const items = context.rules.game.items
  return <>
    {Object.entries(items).map(([stringType, items]) =>
      items && <DynamicItemsTypeDisplay key={stringType} type={parseInt(stringType)} items={items}/>
    )}
  </>
}

type DynamicItemsTypeDisplayProps = {
  type: number
  items: MaterialItem[]
}

const DynamicItemsTypeDisplay = ({ type, items }: DynamicItemsTypeDisplayProps) => {
  const context = useMaterialContext()
  const { focus, addFocusRef } = useFocusContext()
  const locators = context.locators
  const { t } = useTranslation()
  return <>{items.map((item, index) => {
    const locator = locators[item.location.type]
    return [...Array(item.quantity ?? 1)].map((_, displayIndex) => {
      const itemContext: ItemContext = { ...context, type, index, displayIndex }
      if (locator?.hide(item, itemContext)) return null
      const innerLocations = getInnerLocations(item, itemContext, focus)
      const isFocused = isItemFocus(type, index, focus)
      return <DraggableMaterial key={`${type}_${index}_${displayIndex}`}
                                type={type} index={index} displayIndex={displayIndex}
                                playDown={focus && !isFocused && !innerLocations.some(location => location.focus)}
                                ref={isFocused ? addFocusRef : undefined}
                                title={item.quantity !== undefined ? t('quantity.tooltip', { n: item.quantity })! : undefined}>
        <LocationsMask locations={innerLocations.filter(l => l.focus).map(l => l.location)}/>
        {innerLocations.map(({ focus, location }) =>
          <SimpleDropArea key={JSON.stringify(location)} location={location} alwaysVisible={focus} ref={focus ? addFocusRef : undefined}/>)}
      </DraggableMaterial>
    })
  })}</>
}
