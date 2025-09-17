import { css } from '@emotion/react'
import { MaterialItem } from '@gamepark/rules-api'
import { HTMLAttributes, useMemo } from 'react'
import { transformCss } from '../../css'
import { ItemContext } from '../../locators'
import { removeRotations } from './animations/rotations.utils'
import { MaterialDescription } from './MaterialDescription'

type ItemMenuWrapperProps = {
  item: MaterialItem
  itemContext: ItemContext
  description: MaterialDescription
} & HTMLAttributes<HTMLDivElement>

export const ItemMenuWrapper = ({ item, itemContext, description, ...props }: ItemMenuWrapperProps) => {
  const itemTransform = useMemo(() => removeRotations(description.getItemTransform(item, itemContext)), [description, item, itemContext])
  return <div css={[itemMenuWrapperCss, transformCss(...itemTransform, 'translateZ(15em)')]} {...props}/>
}

const itemMenuWrapperCss = css`
  position: absolute;
  transform-style: preserve-3d;

  > * {
    position: absolute;
  }
`
