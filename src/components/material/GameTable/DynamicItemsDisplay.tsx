import { MaterialItem } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'
import { useMaterialContext } from '../../../hooks'
import { ItemContext } from '../../../locators'
import { DraggableMaterial } from '../DraggableMaterial'
import { useFocusContext } from './focus'

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
  const description = context.material[type]
  if (!description) return null
  return <>{items.map((item, index) => {
    const locator = locators[item.location.type]
    return [...Array(item.quantity ?? 1)].map((_, displayIndex) => {
      const itemContext: ItemContext = { ...context, type, index, displayIndex }
      if (locator?.hide(item, itemContext)) return null
      const isFocused = focus?.materials.some(material =>
        material.type === type && material.getIndexes().includes(index)
      )
      return <DraggableMaterial key={`${type}_${index}_${displayIndex}`} highlight={description.highlight(item, itemContext)}
                                type={type} index={index} displayIndex={displayIndex} isFocused={isFocused}
                                title={item.quantity !== undefined ? t('quantity.tooltip', { n: item.quantity })! : undefined}/>
    })
  })}</>
}
