/** @jsxImportSource @emotion/react */
import { CollisionDetection, DndContext, DragEndEvent, getClientRect, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { css, Global } from '@emotion/react'
import { dropItemMove, Location } from '@gamepark/rules-api'
import React, { FC, HTMLAttributes, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ReactZoomPanPinchContentRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { fontSizeCss, perspectiveCss } from '../../../css'
import { useLegalMoves, useMaterialContext, usePlay } from '../../../hooks'
import { calculateBounds, getMouseBoundedPosition } from '../../../utilities/bounds.util'
import { dataIsDisplayedItem } from '../DraggableMaterial'
import { GameMaterialDisplay } from './GameMaterialDisplay'

export type GameTableProps = {
  collisionAlgorithm?: CollisionDetection
  snapToCenter?: boolean
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  perspective?: number
  margin?: { left: number, top: number, right: number, bottom: number }
  verticalCenter?: boolean
} & HTMLAttributes<HTMLDivElement>

const wheel = { step: 0.05 }
const doubleClick = { disabled: true }
const pointerSensorOptions = { activationConstraint: { distance: 2 } }
export const GameTable: FC<GameTableProps> = (
  { collisionAlgorithm, snapToCenter = true, perspective, xMin, xMax, yMin, yMax, margin = { left: 0, right: 0, top: 7, bottom: 0 }, verticalCenter, children, ...props }
) => {

  const [dragging, setDragging] = useState(false)
  const sensors = useSensors(
    useSensor(PointerSensor, pointerSensorOptions)
  )

  const context = useMaterialContext()
  const play = usePlay()
  const legalMoves = useLegalMoves()
  const onDragEnd = useCallback((event: DragEndEvent) => {
    setDragging(false)
    if (event.over && dataIsDisplayedItem(event.active.data.current) && dataIsLocation(event.over.data.current)) {
      const item = event.active.data.current
      const { type, index, displayIndex } = item
      const description = context.material[type]
      const location = event.over.data.current
      const locator = context.locators[location.type]
      const itemContext = { ...context, ...item }
      const moves = legalMoves.filter(move =>
        description?.canDrag(move, itemContext) && locator?.locationDescription?.canDrop(move, location, itemContext)
      )
      if (moves.length === 1) {
        play(dropItemMove(type, index, displayIndex), { local: true })
        play(moves[0])
      }
    }
  }, [context, play, legalMoves])

  const ref = useRef<ReactZoomPanPinchContentRef>(null)
  useEffect(() => {
    const handler = () => {
      const zoomPanPinch = ref.current?.instance
      if (!zoomPanPinch?.bounds) return
      const { positionX, positionY, scale } = zoomPanPinch.transformState
      const bounds = calculateBounds(zoomPanPinch, scale)
      const { x, y } = getMouseBoundedPosition(positionX, positionY, bounds, true, 0, 0, zoomPanPinch.wrapperComponent)
      zoomPanPinch.setTransformState(scale, x, y)
    }
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('resize', handler)
    }
  }, [])

  const hm = margin.left + margin.right
  const vm = margin.top + margin.bottom
  const tableFontSize = 5
  const minScale = (100 - vm) / tableFontSize / (yMax - yMin)
  const maxScale = minScale > 0.9 ? minScale : 1
  const ratio = (xMax - xMin) / (yMax - yMin)
  const ratioWithMargins = ((100 - vm) * ratio + hm) / 100
  const panning = useMemo(() => ({ disabled: dragging }), [dragging])
  const wrapperStyle: React.CSSProperties = useMemo(() => ({
    position: 'absolute',
    margin: `${margin.top}em ${margin.right}em ${margin.bottom}em ${margin.left}em`,
    transformStyle: 'preserve-3d',
    height: verticalCenter? `calc(100% - ${vm}em)`: `min(100% - ${vm}em, (100dvw - ${hm}em) / ${ratio})`,
    width: `calc(100dvw - ${hm}em)`,
    overflow: 'visible',
  }), [margin, vm, hm, ratio])

  const modifiers = useMemo(() => snapToCenter? [snapCenterToCursor]: undefined, [snapToCenter])

  return (
    <DndContext collisionDetection={collisionAlgorithm} measuring={{ draggable: { measure: getClientRect }, droppable: { measure: getClientRect } }}
                modifiers={modifiers} sensors={sensors}
                onDragStart={() => setDragging(true)} onDragEnd={onDragEnd} onDragCancel={() => setDragging(false)}>
      <Global styles={ratioFontSize(ratioWithMargins)}/>
      <TransformWrapper  ref={ref} minScale={minScale} maxScale={maxScale} initialScale={minScale}
                        centerOnInit={true} wheel={wheel} smooth={false} panning={panning} disablePadding doubleClick={doubleClick}>
        <TransformComponent wrapperStyle={wrapperStyle}>
          <div css={[tableCss(xMin, xMax, yMin, yMax), fontSizeCss(tableFontSize), perspective && perspectiveCss(perspective)]} {...props}>
            <GameMaterialDisplay left={-xMin} top={-yMin}>
              {children}
            </GameMaterialDisplay>
          </div>
        </TransformComponent>
      </TransformWrapper>
    </DndContext>
  )
}

function dataIsLocation<P extends number = number, L extends number = number>(data?: Record<string, any>): data is Location<P, L> {
  return typeof data?.type === 'number'
}

const ratioFontSize = (ratio: number) => css`
  .react-transform-wrapper {
    font-size: 1dvh;
    @media (max-aspect-ratio: ${ratio}/1) {
      font-size: calc(1dvw / ${ratio});
    }
  }
`

const tableCss = (xMin: number, xMax: number, yMin: number, yMax: number) => css`
  transform-style: preserve-3d;
  width: ${xMax - xMin}em;
  height: ${yMax - yMin}em;
`
