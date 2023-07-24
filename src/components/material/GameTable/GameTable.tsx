/** @jsxImportSource @emotion/react */
import { FC, useCallback, useState } from 'react'
import { dropItemMove, Location, MaterialRules } from '@gamepark/rules-api'
import { TransformWrapper } from 'react-zoom-pan-pinch'
import { useLegalMoves, useMaterialContext, usePlay, useRules } from '../../../hooks'
import { CollisionDetection, DndContext, DragEndEvent, getClientRect } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { GameTableContent, GameTableContentProps } from './GameTableContent'
import { dataIsDisplayedItem } from '../DraggableMaterial'

export type GameTableProps = GameTableContentProps & {
  collisionAlgorithm?: CollisionDetection
}

const wheel = { step: 0.05 }
const doubleClick = { disabled: true }

export const GameTable: FC<GameTableProps> = ({ collisionAlgorithm, ...props }) => {
  const { zoomMin = 1, zoomMax = 1 } = props

  const [dragging, setDragging] = useState(false)

  const context = useMaterialContext()
  const play = usePlay()
  const rules = useRules<MaterialRules>()!
  const legalMoves = useLegalMoves()
  const onDragEnd = useCallback((event: DragEndEvent) => {
    setDragging(false)
    if (event.over && dataIsDisplayedItem(event.active.data.current) && dataIsLocation(event.over.data.current)) {
      const item = event.active.data.current
      const { type, index, displayIndex } = item
      const description = context.material[type]
      const location = event.over.data.current
      const locator = context.locators[location.type]
      const moves = legalMoves.filter(move =>
        description.canDrag(move, { ...context, ...item }) && locator.locationDescription!.canDrop(move, location, context)
      )
      if (moves.length === 1) {
        play(dropItemMove(type, index, displayIndex), { local: true })
        play(moves[0])
      }
    }
  }, [play, rules, legalMoves])

  return (
    <DndContext collisionDetection={collisionAlgorithm} measuring={{ draggable: { measure: getClientRect }, droppable: { measure: getClientRect } }}
                modifiers={[snapCenterToCursor]}
                onDragStart={() => setDragging(true)} onDragEnd={onDragEnd} onDragCancel={() => setDragging(false)}>
      <TransformWrapper minScale={zoomMin / zoomMax} maxScale={1} initialScale={zoomMin / zoomMax} centerOnInit={true} wheel={wheel} smooth={false}
                        panning={{ disabled: dragging }} disablePadding doubleClick={doubleClick}>
        <GameTableContent {...props} />
      </TransformWrapper>
    </DndContext>
  )
}

function dataIsLocation<P extends number = number, L extends number = number>(data?: Record<string, any>): data is Location<P, L> {
  return typeof data?.type === 'number'
}
