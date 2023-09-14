/** @jsxImportSource @emotion/react */
import React, { FC, HTMLAttributes, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { dropItemMove, Location } from '@gamepark/rules-api'
import { ReactZoomPanPinchContentRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { useLegalMoves, useMaterialContext, usePlay } from '../../../hooks'
import { CollisionDetection, DndContext, DragEndEvent, getClientRect } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { dataIsDisplayedItem } from '../DraggableMaterial'
import { css, Global } from '@emotion/react'
import { fontSizeCss, perspectiveCss } from '../../../css'
import { GameMaterialDisplay } from './GameMaterialDisplay'
import { calculateBounds, getMouseBoundedPosition } from '../../../utilities/bounds.util'

export type GameTableProps = {
  collisionAlgorithm?: CollisionDetection
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  perspective?: number
  margin?: { left: number, top: number, right: number, bottom: number }
} & HTMLAttributes<HTMLDivElement>

const wheel = { step: 0.05 }
const doubleClick = { disabled: true }

export const GameTable: FC<GameTableProps> = (
  { collisionAlgorithm, perspective, xMin, xMax, yMin, yMax, margin = { left: 0, right: 0, top: 7, bottom: 0 }, children, ...props }
) => {

  const [dragging, setDragging] = useState(false)

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
      const moves = legalMoves.filter(move =>
        description.canDrag(move, { ...context, ...item }) && locator.locationDescription!.canDrop(move, location, context)
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
  const ratio = (xMax - xMin) / (yMax - yMin)
  const ratioWithMargins = ((100 - vm) * ratio + hm) / 100
  const panning = useMemo(() => ({ disabled: dragging }), [dragging])
  const wrapperStyle: React.CSSProperties = useMemo(() => ({
    position: 'absolute',
    margin: `${margin.top}em ${margin.right}em ${margin.bottom}em ${margin.left}em`,
    transformStyle: 'preserve-3d',
    height: `min(100% - ${vm}em, (100dvw - ${hm}em) / ${ratio})`,
    width: `calc(100dvw - ${hm}em)`,
    overflow: 'visible'
  }), [margin, vm, hm, ratio])
  return (
    <DndContext collisionDetection={collisionAlgorithm} measuring={{ draggable: { measure: getClientRect }, droppable: { measure: getClientRect } }}
                modifiers={[snapCenterToCursor]}
                onDragStart={() => setDragging(true)} onDragEnd={onDragEnd} onDragCancel={() => setDragging(false)}>
      <Global styles={ratioFontSize(ratioWithMargins)}/>
      <TransformWrapper ref={ref} minScale={minScale} maxScale={1} initialScale={minScale} centerOnInit={true} wheel={wheel} smooth={false}
                        panning={panning} disablePadding doubleClick={doubleClick}>
        <TransformComponent wrapperStyle={wrapperStyle}>
          <div css={[tableCss(xMin, xMax, yMin, yMax), fontSizeCss(tableFontSize), perspective && perspectiveCss(perspective)]} {...props}>
            <GameMaterialDisplay/>
            {children}
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

  > * {
    position: absolute;
    top: ${-yMin}em;
    left: ${-xMin}em;
    transform-style: preserve-3d;
  }
`
