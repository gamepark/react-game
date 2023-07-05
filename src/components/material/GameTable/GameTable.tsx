/** @jsxImportSource @emotion/react */
import { FC, useCallback, useState } from 'react'
import { dropItemMove, MaterialRules } from '@gamepark/rules-api'
import { TransformWrapper } from 'react-zoom-pan-pinch'
import { useLegalMoves, useMaterialContext, usePlay, useRules } from '../../../hooks'
import { CollisionDetection, DndContext, DragEndEvent, getClientRect } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { GameTableContent } from './GameTableContent'
import { useStocks } from '../../../hooks/useStocks'
import { isDraggedItem } from '../DraggableMaterial'
import { isDropLocation } from '../locations'

export type GameTableProps = {
  collisionAlgorithm?: CollisionDetection
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  zoomMin?: number
  zoomMax?: number
  perspective?: number
  margin?: { left: number, top: number, right: number, bottom: number }
}

const wheel = { step: 0.05 }
const doubleClick = { disabled: true }

export const GameTable: FC<GameTableProps> = (props) => {
  const { collisionAlgorithm, zoomMin = 1, zoomMax = 1 } = props

  const [dragging, setDragging] = useState(false)

  const context = useMaterialContext()
  const play = usePlay()
  const player = context.player
  const rules = useRules<MaterialRules>()!
  const legalMoves = useLegalMoves()
  const stocks = useStocks()
  const onDragEnd = useCallback((event: DragEndEvent) => {
    setDragging(false)
    if (event.over && isDraggedItem(event.active.data.current) && isDropLocation(event.over.data.current)) {
      const { type, index, displayIndex } = event.active.data.current
      const location = event.over.data.current
      const locator = context.locators[location.type]
      const moves = legalMoves.filter(move => rules.isMoveTrigger(move, move => locator.isMoveItemToLocation(move, type, index, location, stocks, context)))
      if (moves.length === 1) {
        play(dropItemMove(type, index, displayIndex), { local: true })
        play(moves[0], { delayed: rules.isUnpredictableMove(moves[0], player!) })
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
