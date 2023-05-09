/** @jsxImportSource @emotion/react */
import { FC, MouseEvent } from 'react'
import { MaterialItem, MaterialRules, MaterialRulesMove } from '@gamepark/rules-api'
import { css } from '@emotion/react'
import { MaterialDescription } from './MaterialDescription'
import { MaterialComponent } from './MaterialComponent'
import { Draggable, DraggableProps } from '../Draggable'
import { pointerCursorCss, shineEffect } from '../../css'

export type DraggableMaterialProps<Player extends number = number, MaterialType extends number = number, LocationType extends number = number> = {
  description: MaterialDescription
  legalMoves?: MaterialRulesMove<Player, MaterialType, LocationType>[]
  rules: MaterialRules<Player, MaterialType, LocationType>
  item: MaterialItem<Player, LocationType>
  index: number
  type: MaterialType
  onClick?: (event: MouseEvent<HTMLElement>) => void
  onLongPress?: () => void
} & Omit<DraggableProps, 'type' | 'item' | 'onClick'>

export type DragMaterialItem<Player extends number = number, MaterialType extends number = number, LocationType extends number = number> = {
  item: MaterialItem<Player, LocationType>
  type: MaterialType
  index: number
}

export const DraggableMaterial: FC<DraggableMaterialProps>
  = ({ description, preTransform, legalMoves = [], rules, item, type, index, onClick, onLongPress, ...props }) => {
  const canDrag = legalMoves.length > 0
  return (
    <Draggable preTransform={[`translate(-50%, -50%)`, preTransform].join(' ')} canDrag={canDrag}
               onMouseDown={event => canDrag && event.stopPropagation()} onTouchStart={event => canDrag && event.stopPropagation()}
               item={{ item, type, index }} type={type.toString()} {...props}>
      <MaterialComponent description={description} itemId={item.id} css={[relativeCss, canDrag ? shineEffect : pointerCursorCss]} rules={rules}
                         onClick={onClick} onLongPress={onLongPress}/>
    </Draggable>
  )
}

const relativeCss = css`
  position: relative;
`

