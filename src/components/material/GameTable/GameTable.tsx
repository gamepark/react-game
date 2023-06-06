/** @jsxImportSource @emotion/react */
import { FC, useCallback, useState } from 'react'
import { Location, MaterialRules } from '@gamepark/rules-api'
import { TransformWrapper } from 'react-zoom-pan-pinch'
import { MaterialDescription } from '../MaterialDescription'
import { ItemLocator } from '../../../locators'
import { useLegalMoves, usePlay, usePlayerId, useRules } from '../../../hooks'
import { DndContext, DragEndEvent, getClientRect } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { isMoveThisItemToLocation } from '../utils'
import { GameTableContent } from './GameTableContent'

export type GameTableProps<MaterialType extends number = number, LocationType extends number = number> = {
  material: Record<MaterialType, MaterialDescription>
  locators: Record<LocationType, ItemLocator>
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
  const { zoomMin = 1, zoomMax = 1 } = props

  const [dragging, setDragging] = useState(false)

  const play = usePlay()
  const playerId = usePlayerId()
  const rules = useRules<MaterialRules>()!
  const legalMoves = useLegalMoves()
  const onDragEnd = useCallback((event: DragEndEvent) => {
    setDragging(false)
    if (event.active.data.current && event.over?.data.current) {
      const { type, index } = event.active.data.current
      const moves = legalMoves.filter(move => rules.isMoveTrigger(move, move => isMoveThisItemToLocation(move, type, index, event.over?.data.current as Location)))
      if (moves.length === 1) {
        play(moves[0], { delayed: rules.isUnpredictableMove(moves[0], playerId) })
      }
    }
  }, [play, rules, legalMoves])

  return (
    <DndContext measuring={{ draggable: { measure: getClientRect }, droppable: { measure: getClientRect } }} modifiers={[snapCenterToCursor]}
                onDragStart={() => setDragging(true)} onDragEnd={onDragEnd} onDragCancel={() => setDragging(false)}>
      <TransformWrapper minScale={zoomMin / zoomMax} maxScale={1} initialScale={zoomMin / zoomMax} centerOnInit={true} wheel={wheel}
                        panning={{ disabled: dragging }} disablePadding doubleClick={doubleClick}>
        <GameTableContent {...props} />
      </TransformWrapper>
    </DndContext>
  )
}
