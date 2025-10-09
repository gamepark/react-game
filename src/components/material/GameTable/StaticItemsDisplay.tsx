import { css, Interpolation, Theme } from '@emotion/react'
import { GridBoundaries, MaterialItem, MaterialMove } from '@gamepark/rules-api'
import { isEqual } from 'es-toolkit'
import { useLegalMoves, useMaterialContext } from '../../../hooks'
import { getLocationOriginCss } from '../../../locators'
import { ItemMenuWrapper } from '../ItemMenuWrapper'
import { MaterialDescription } from '../MaterialDescription'
import { StaticItem, useFocusContext } from './focus'
import { ItemDisplay } from './ItemDisplay'

export const StaticItemsDisplay = ({ boundaries }: { boundaries: GridBoundaries }) => {
  const material = useMaterialContext().material
  return <>
    {Object.entries(material).map(([stringType, description]) =>
      description && <StaticItemsTypeDisplay key={stringType} type={parseInt(stringType)} description={description} boundaries={boundaries}/>
    )}
  </>
}

type StaticItemsTypeDisplayProps = {
  type: number
  description: MaterialDescription
  boundaries: GridBoundaries
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
  boundaries: GridBoundaries
}

const StaticItemDisplay = ({ type, description, index, displayIndex, item, boundaries, ...props }: StaticItemDisplay) => {
  const context = useMaterialContext()
  const locator = context.locators[item.location.type]
  const { focus } = useFocusContext()
  const isFocused = focus && getStaticItemsOfType(focus.staticItems, type).some(focusedItem => isEqual(focusedItem, item))
  const legalMoves = useLegalMoves<MaterialMove>()
  const itemContext = { ...context, type, index, displayIndex }
  const menu = description.getItemMenu(item, itemContext, legalMoves)
  const locationOriginCss = getLocationOriginCss(boundaries, locator?.getLocationOrigin(item.location, context))
  return <>
    <ItemDisplay type={type} index={index} displayIndex={displayIndex} item={item}
                 isFocused={isFocused} highlight={description.highlight(item, itemContext)}
                 css={[locationOriginCss, topLeftTransition]}
                 {...props}/>
    {menu && <ItemMenuWrapper item={item} itemContext={itemContext} description={description} css={locationOriginCss} {...props}>{menu}</ItemMenuWrapper>}
  </>
}

const topLeftTransition = css`
  transition: top 0.2s, left 0.2s;
`

function getStaticItemsOfType<P extends number = number, M extends number = number, L extends number = number>(
  staticItems: StaticItem<P, M, L>[] | Partial<Record<M, MaterialItem<P, L>[]>>, type: M
): MaterialItem<P, L>[] {
  if (Array.isArray(staticItems)) {
    return staticItems.filter(s => s.type === type).map(s => s.item)
  } else {
    return staticItems[type] ?? []
  }
}
