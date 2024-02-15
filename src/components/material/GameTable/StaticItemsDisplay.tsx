/** @jsxImportSource @emotion/react */
import { Interpolation, Theme } from '@emotion/react'
import { displayMaterialHelp } from '@gamepark/rules-api'
import equal from 'fast-deep-equal'
import { useMaterialContext, usePlay } from '../../../hooks'
import { MaterialDescription } from '../MaterialDescription'
import { useFocusContext } from './focus'
import { ItemDisplay } from './ItemDisplay'

export const StaticItemsDisplay = (props: { css?: Interpolation<Theme> }) => {
  const material = useMaterialContext().material
  return <>
    {Object.entries(material).map(([stringType, description]) =>
      description && <StaticItemsTypeDisplay key={stringType} type={parseInt(stringType)} description={description} {...props}/>
    )}
  </>
}

type StaticItemsTypeDisplayProps = {
  type: number
  description: MaterialDescription
  css?: Interpolation<Theme>
}

const StaticItemsTypeDisplay = ({ type, description, ...props }: StaticItemsTypeDisplayProps) => {
  const context = useMaterialContext()
  const { focus } = useFocusContext()
  const play = usePlay()
  return <>{description.getStaticItems(context).map((item, index) => {
    return [...Array(item.quantity ?? 1)].map((_, displayIndex) => {
      const isFocused = focus?.staticItems.some(focusedItem =>
        focusedItem.type === type && equal(focusedItem.item, item)
      )
      return <ItemDisplay key={`${type}_${index}_${displayIndex}`}
                          type={type} index={index} displayIndex={displayIndex} item={item}
                          isFocused={isFocused}
                          onShortClick={() => play(displayMaterialHelp(type, item, index, displayIndex), { local: true })}
                          {...props}/>
    })
  })}</>
}
