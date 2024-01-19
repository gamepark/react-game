/** @jsxImportSource @emotion/react */
import { displayMaterialHelp } from '../../../../../workshop/packages/rules-api'
import { useMaterialContext, usePlay } from '../../../hooks'
import { MaterialDescription } from '../MaterialDescription'
import { isStaticItemFocus, useFocusContext } from './focus'
import { ItemDisplay } from './ItemDisplay'

export const StaticItemsDisplay = () => {
  const material = useMaterialContext().material
  return <>
    {Object.entries(material).map(([stringType, description]) =>
      description && <StaticItemsTypeDisplay key={stringType} type={parseInt(stringType)} description={description}/>
    )}
  </>
}

type StaticItemsTypeDisplayProps = {
  type: number
  description: MaterialDescription
}

const StaticItemsTypeDisplay = ({ type, description }: StaticItemsTypeDisplayProps) => {
  const context = useMaterialContext()
  const { focus } = useFocusContext()
  const play = usePlay()
  return <>{description.getStaticItems(context).map((item, index) => {
    return [...Array(item.quantity ?? 1)].map((_, displayIndex) => {
      return <ItemDisplay key={`${type}_${index}_${displayIndex}`}
                          type={type} index={index} displayIndex={displayIndex} item={item}
                          isFocused={isStaticItemFocus(type, item, focus)}
                          onShortClick={() => play(displayMaterialHelp(type, item, index, displayIndex), { local: true })}/>
    })
  })}</>
}
