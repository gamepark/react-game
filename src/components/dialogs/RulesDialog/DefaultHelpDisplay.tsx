import { css } from '@emotion/react'
import { MaterialItem } from '@gamepark/rules-api'
import { fontSizeCss } from '../../../css'
import { useMaterialContext, useMaterialDescription } from '../../../hooks'
import { ItemContext, ParentFace } from '../../../locators'
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
  // Each face of the item carries its own locations, exactly like on the game table (see {@link ItemDisplay}).
  const faceUp = description.isFlippedInDialog(item, itemContext) ? ParentFace.Back : ParentFace.Front
  const faceContent = (face: ParentFace) => locations.map((location) => {
    const locator = context.locators[location.type]
    const parentFace = locator?.getParentFace(location, context) ?? ParentFace.Front
    if ((parentFace === ParentFace.Up ? faceUp : parentFace) !== face) return null
    const locationDescription = locator?.getLocationDescription(location, context)
    if (!locationDescription || !locationDescription.displayInParentItemHelp) return null
    return <LocationDisplay key={JSON.stringify(location)} location={location} description={locationDescription as any}/>
  })
  return (
    <div css={css`position: relative; flex-shrink: 0;`}>
      <MaterialComponent type={itemType} itemId={item.id} itemIndex={itemIndex} displayIndex={displayIndex}
                         backChildren={faceContent(ParentFace.Back)} css={[
        fontSizeCss(Math.min(75 / height, 75 / width, 10)),
        description.getHelpDisplayExtraCss(item, itemContext)
      ]}>
        {faceContent(ParentFace.Front)}
      </MaterialComponent>
    </div>
  )
}
