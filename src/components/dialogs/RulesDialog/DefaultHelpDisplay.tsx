import { css } from '@emotion/react'
import { MaterialItem } from '@gamepark/rules-api'
import { fontSizeCss } from '../../../css'
import { useMaterialContext, useMaterialDescription } from '../../../hooks'
import { ItemContext } from '../../../locators'
import { MaterialComponent, MaterialHelpDisplayProps } from '../../material'
import { LocationDisplay } from '../../material/locations/LocationDisplay'

export const DefaultHelpDisplay = <P extends number = number, M extends number = number, L extends number = number>(
  { item, itemType, itemIndex, displayIndex }: MaterialHelpDisplayProps<P, M, L>
) => {
  const context = useMaterialContext<P, M, L>()
  const description = useMaterialDescription<P, M, L>(itemType)
  if (!description) return null
  const itemContext: ItemContext<P, M, L> = { ...context, type: itemType, index: itemIndex!, displayIndex: displayIndex! }
  const { width, height } = description.getSize(item.id)
  const locations = item.location ? context.material[itemType]?.getLocations(item as MaterialItem<P, L, any>, itemContext) ?? [] : []
  return (
    <div css={css`position: relative; flex-shrink: 0;`}>
      <MaterialComponent type={itemType} itemId={item.id} itemIndex={itemIndex} css={[
        fontSizeCss(Math.min(75 / height, 75 / width, 10)),
        description.getHelpDisplayExtraCss(item, itemContext)
      ]}>
        {locations.map((location) => {
          const locationDescription = context.locators[location.type]?.getLocationDescription(location, context)
          if (!locationDescription || !locationDescription.displayInParentItemHelp) return null
          return <LocationDisplay key={JSON.stringify(location)} location={location} description={locationDescription as any}/>
        })}
      </MaterialComponent>
    </div>
  )
}
