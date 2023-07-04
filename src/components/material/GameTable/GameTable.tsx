/** @jsxImportSource @emotion/react */
import { FC, useCallback, useState } from 'react'
import { dropItemMove, MaterialRules } from '@gamepark/rules-api'
import { TransformWrapper } from 'react-zoom-pan-pinch'
import { useLegalMoves, usePlay, usePlayerId, useRules } from '../../../hooks'
import { DndContext, DragEndEvent, getClientRect } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { GameTableContent } from './GameTableContent'
import { useStocks } from '../../../hooks/useStocks'
import { isDraggedItem } from '../DraggableMaterial'
import { isDropLocation } from '../DropAreas'
import { useLocators } from '../../../hooks/useLocators'
import { BaseContext } from '../../../locators'
import { useMaterials } from '../../../hooks/useMaterials'

export type GameTableProps = {
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

  const locators = useLocators()
  const materials = useMaterials()
  const play = usePlay()
  const playerId = usePlayerId()
  const rules = useRules<MaterialRules>()!
  const legalMoves = useLegalMoves()
  const stocks = useStocks()
  const onDragEnd = useCallback((event: DragEndEvent) => {
    setDragging(false)
    if (event.over && isDraggedItem(event.active.data.current) && isDropLocation(event.over.data.current)) {
      const { type, index, displayIndex } = event.active.data.current
      const location = event.over.data.current
      const locator = locators![location.type]
      const context: BaseContext = { game: rules!.game, player: playerId, material: materials!, locators: locators! }
      const moves = legalMoves.filter(move => rules.isMoveTrigger(move, move => locator.isMoveItemToLocation(move, type, index, location, stocks, context)))
      if (moves.length === 1) {
        play(dropItemMove(type, index, displayIndex), { local: true })
        play(moves[0], { delayed: rules.isUnpredictableMove(moves[0], playerId) })
      }
    }
  }, [play, rules, legalMoves])

  return (
    <DndContext measuring={{ draggable: { measure: getClientRect }, droppable: { measure: getClientRect } }} modifiers={[snapCenterToCursor]}
                onDragStart={() => setDragging(true)} onDragEnd={onDragEnd} onDragCancel={() => setDragging(false)}>
      <TransformWrapper minScale={zoomMin / zoomMax} maxScale={1} initialScale={zoomMin / zoomMax} centerOnInit={true} wheel={wheel} smooth={false}
                        panning={{ disabled: dragging }} disablePadding doubleClick={doubleClick}>
        <GameTableContent {...props} />
      </TransformWrapper>
    </DndContext>
  )
}
