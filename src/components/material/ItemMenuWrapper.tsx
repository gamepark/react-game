import { css } from '@emotion/react'
import { MaterialItem } from '@gamepark/rules-api'
import { isEqual } from 'es-toolkit'
import { HTMLAttributes, useMemo } from 'react'
import { transformCss } from '../../css'
import { ItemContext } from '../../locators'
import { combineEventListeners } from '../../utilities'
import { removeRotations } from './animations/rotations.utils'
import { carriesHover, getItemAndParents, useHoveredItems } from './GameTable/HoveredItem'
import { MaterialDescription } from './MaterialDescription'

type ItemMenuWrapperProps = {
  item: MaterialItem
  itemContext: ItemContext
  description: MaterialDescription
} & HTMLAttributes<HTMLDivElement>

/**
 * The menu of an item follows its hover when the item carries it (see ItemContext.hovered): the menu gets the hover
 * transforms of the item and of the items it is placed on, and eases with them. The pointer on the menu counts as on the
 * item, so that the item does not shrink when the pointer goes onto its menu.
 */
export const ItemMenuWrapper = ({ item, itemContext: context, description, ...props }: ItemMenuWrapperProps) => {
  const { hovered, listeners } = useHoveredItems(context.type, context.index, item)
  const itemContext = useMemo(() => hovered ? { ...context, hovered } : context, [context, hovered])
  const followsHover = useMemo(() => getItemAndParents({ type: context.type, index: context.index, item }, context).some(h => carriesHover(h, context)),
    [context, item])
  const itemTransform = useMemo(() => {
    const transform = description.getItemTransform(item, itemContext)
    if (hovered?.some(h => h.type === context.type && h.index === context.index && isEqual(h.item, item))) {
      transform.push(...description.getHoverTransform(item, itemContext))
    }
    return removeRotations(transform)
  }, [description, item, itemContext, hovered, context.type, context.index])
  return <div css={[itemMenuWrapperCss, followsHover && hoverTransitionCss, transformCss(...itemTransform, 'translateZ(15em)')]}
              {...props} {...combineEventListeners(listeners, props)}/>
}

const itemMenuWrapperCss = css`
  position: absolute;
  transform-style: preserve-3d;

  > * {
    position: absolute;
  }
`

/** The same pace as the item and the items placed on it (carriedHoverCss of ItemDisplay). */
const hoverTransitionCss = css`
  transition: transform 0.2s ease-in-out;
`
