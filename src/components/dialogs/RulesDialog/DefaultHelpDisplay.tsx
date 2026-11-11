import { css } from '@emotion/react'
import { MaterialItem } from '@gamepark/rules-api'
import { isEqual } from 'es-toolkit'
import { ReactNode } from 'react'
import { fontSizeCss } from '../../../css'
import { useMaterialContext, useMaterialDescription } from '../../../hooks'
import { ItemContext, MaterialContext, ParentFace } from '../../../locators'
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
  // Each face of the item carries its own locations and items, exactly like on the game table (see {@link ItemDisplay}).
  const faceUp = description.isFlippedInDialog(item, itemContext) ? ParentFace.Back : ParentFace.Front
  const faceContent = (face: ParentFace) => <>
    {item.location && <FaceLocations item={item as MaterialItem<P, L>} itemContext={itemContext} face={face} faceUp={faceUp}/>}
    <FaceItems parent={item} parentType={itemType} parentIndex={itemIndex} face={face} faceUp={faceUp} context={context}/>
  </>
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

type FaceLocationsProps<P extends number, M extends number, L extends number> = {
  item: MaterialItem<P, L>
  itemContext: ItemContext<P, M, L>
  face: ParentFace
  faceUp: ParentFace
}

const FaceLocations = <P extends number, M extends number, L extends number>({ item, itemContext, face, faceUp }: FaceLocationsProps<P, M, L>) => {
  const locations = itemContext.material[itemContext.type]?.getLocations(item, itemContext) ?? []
  return <>
    {locations.map((location) => {
      const locator = itemContext.locators[location.type]
      const parentFace = locator?.getParentFace(location, itemContext) ?? ParentFace.Front
      if ((parentFace === ParentFace.Up ? faceUp : parentFace) !== face) return null
      const locationDescription = locator?.getLocationDescription(location, itemContext)
      if (!locationDescription || !locationDescription.displayInParentItemHelp) return null
      return <LocationDisplay key={JSON.stringify(location)} location={location} description={locationDescription as any}/>
    })}
  </>
}

type FaceItemsProps<P extends number, M extends number, L extends number> = {
  parent: Partial<MaterialItem<P, L>>
  parentType: M
  parentIndex?: number
  face: ParentFace
  faceUp: ParentFace
  context: MaterialContext<P, M, L>
}

/**
 * The items placed on a face of the parent, for the item types that ask for it ({@link MaterialDescription.displayInParentItemHelp}).
 * Each one is rendered inside the face, centred on it, and placed by its locator relative to the parent
 * (see {@link ItemContext.relativeToParent}); the items placed on it in turn are rendered inside its own faces.
 */
const FaceItems = <P extends number, M extends number, L extends number>(
  { parent, parentType, parentIndex, face, faceUp, context }: FaceItemsProps<P, M, L>
) => {
  const { rules, material, locators } = context
  const children: ReactNode[] = []
  for (const key in material) {
    const type = Number(key) as M
    const description = material[type]
    if (!description?.displayInParentItemHelp) continue
    // Static items are matched on their parent item only: their index is not an index in the game state
    const candidates = [
      ...description.getStaticItems(context).map((item, index) => ({ item, index, isStatic: true })),
      ...rules.material(type).entries.map(([index, item]) => ({ item, index, isStatic: false }))
    ]
    for (const { item: child, index, isStatic } of candidates) {
      const locator = locators[child.location.type]
      if (locator?.parentItemType !== parentType) continue
      if (child.location.parent !== undefined
        ? parentIndex === undefined || child.location.parent !== parentIndex
        : !isEqual(locator.getParentItem(child.location, context), parent)) continue
      const childContext: ItemContext<P, M, L> = { ...context, type, index, displayIndex: 0, relativeToParent: true }
      if (locator.hide(child, childContext)) continue
      const parentFace = locator.getItemParentFace(child, childContext)
      if ((parentFace === ParentFace.Up ? faceUp : parentFace) !== face) continue
      const childFaceUp = description.isFlippedOnTable(child, childContext) ? ParentFace.Back : ParentFace.Front
      const childFaceContent = (childFace: ParentFace) =>
        <FaceItems parent={child} parentType={type} parentIndex={isStatic ? undefined : index} face={childFace} faceUp={childFaceUp} context={context}/>
      children.push(
        <MaterialComponent key={`${type}_${isStatic ? 's' : ''}${index}`} type={type} itemId={child.id} itemIndex={index} displayIndex={0}
                           backChildren={childFaceContent(ParentFace.Back)}
                           css={[childCss, description.getItemExtraCss(child, childContext)]}
                           style={{ transform: description.getItemTransform(child, childContext).join(' ') }}>
          {childFaceContent(ParentFace.Front)}
        </MaterialComponent>
      )
    }
  }
  return <>{children}</>
}

const childCss = css`
  position: absolute;
  left: 50%;
  top: 50%;
`
