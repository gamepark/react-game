import { displayMaterialHelp, MaterialItem } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'
import { useMaterialContext, usePlay } from '../../../hooks'
import { ItemContext } from '../../../locators'
import { DraggableMaterial } from '../DraggableMaterial'
import { isItemFocus, useFocusContext } from './focus'
import { ItemDisplay } from './ItemDisplay'

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
  const { focus } = useFocusContext()
  const locators = context.locators
  const { t } = useTranslation()
  const play = usePlay()
  const description = context.material[type]
  if (!description) return null
  return <>{items.map((item, index) => {
    const locator = locators[item.location.type]
    return [...Array(item.quantity ?? 1)].map((_, displayIndex) => {
      const itemContext: ItemContext = { ...context, type, index, displayIndex }
      if (locator?.hide(item, itemContext)) return null
      if (!description.isMobile) {
        return <ItemDisplay key={`${type}_${index}_${displayIndex}`}
                            type={type} index={index} displayIndex={displayIndex} item={item}
                            isFocused={isItemFocus(type, index, focus)}
                            onShortClick={() => play(displayMaterialHelp(type, item, index, displayIndex), { local: true })}/>
      } else {
        return <DraggableMaterial key={`${type}_${index}_${displayIndex}`}
                                  type={type} index={index} displayIndex={displayIndex} isFocused={isItemFocus(type, index, focus)}
                                  title={item.quantity !== undefined ? t('quantity.tooltip', { n: item.quantity })! : undefined}/>
      }
    })
  })}</>
}
