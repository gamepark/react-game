/** @jsxImportSource @emotion/react */
import { Interpolation, Theme } from '@emotion/react'
import { MaterialItem, MaterialMove } from '@gamepark/rules-api'
import { isEqual } from 'es-toolkit'
import { useLegalMoves, useMaterialContext } from '../../../hooks'
import { ItemMenuWrapper } from '../ItemMenuWrapper'
import { MaterialDescription } from '../MaterialDescription'
import { StaticItem, useFocusContext } from './focus'
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

const StaticItemsTypeDisplay = ({ description, ...props }: StaticItemsTypeDisplayProps) => {
  const context = useMaterialContext()
  return <>{description.getStaticItems(context).map((item, index) => {
    return [...Array(item.quantity ?? 1)].map((_, displayIndex) =>
      <StaticItemDisplay key={`${index}_${displayIndex}`} description={description} index={index} displayIndex={displayIndex} item={item} {...props}/>
    )
  })}</>
}

type StaticItemDisplay = StaticItemsTypeDisplayProps & {
  index: number
  displayIndex: number
  item: MaterialItem
}

const StaticItemDisplay = ({ type, description, index, displayIndex, item, ...props }: StaticItemDisplay) => {
  const context = useMaterialContext()
  const { focus } = useFocusContext()
  const isFocused = focus && getStaticItemsOfType(focus.staticItems, type).some(focusedItem => isEqual(focusedItem, item))
  const legalMoves = useLegalMoves<MaterialMove>()
  const itemContext = { ...context, type, index, displayIndex }
  const menu = description.getItemMenu(item, itemContext, legalMoves)
  return <>
    <ItemDisplay type={type} index={index} displayIndex={displayIndex} item={item}
                 isFocused={isFocused} highlight={description.highlight(item, itemContext)}
                 {...props}/>
    {menu && <ItemMenuWrapper item={item} itemContext={itemContext} description={description} {...props}>{menu}</ItemMenuWrapper>}
  </>
}

function getStaticItemsOfType<P extends number = number, M extends number = number, L extends number = number>(
  staticItems: StaticItem<P, M, L>[] | Partial<Record<M, MaterialItem<P, L>[]>>, type: M
): MaterialItem<P, L>[] {
  if (Array.isArray(staticItems)) {
    return staticItems.filter(s => s.type === type).map(s => s.item)
  } else {
    return staticItems[type] ?? []
  }
}
