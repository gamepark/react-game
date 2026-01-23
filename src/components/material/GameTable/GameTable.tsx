import { CollisionDetection, DndContext, DragEndEvent, getClientRect, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { css, Global } from '@emotion/react'
import { isMoveItemsAtOnce, MaterialMoveBuilder } from '@gamepark/rules-api'
import { FC, HTMLAttributes, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ReactZoomPanPinchContentRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { fontSizeCss, perspectiveCss } from '../../../css'
import { useLegalMoves, useMaterialContext, usePlay } from '../../../hooks'
import { calculateBounds, getMouseBoundedPosition } from '../../../utilities/zoom-pan-pinch'
import { dataIsDisplayedItem } from '../DraggableMaterial'
import { getBestDropMove } from '../utils/getBestDropMove'
import { GameMaterialDisplay } from './GameMaterialDisplay'
import { GameTableContext } from './GameTableContext'
import { NoZoomScaleProvider, ZoomScaleProvider } from './ScaleContext'
import dropItemMove = MaterialMoveBuilder.dropItemMove

export type GameTableProps = {
  collisionAlgorithm?: CollisionDetection
  snapToCenter?: boolean
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  perspective?: number
  margin?: { left: number, top: number, right: number, bottom: number }
  tableFontSize?: number
  verticalCenter?: boolean
  zoom?: boolean
} & HTMLAttributes<HTMLDivElement>

const wheel = { step: 0.05 }
const doubleClick = { disabled: true }
const pointerSensorOptions = { activationConstraint: { distance: 2 } }
export const GameTable: FC<GameTableProps> = (
  {
    collisionAlgorithm,
    snapToCenter = true,
    perspective,
    xMin,
    xMax,
    yMin,
    yMax,
    margin = { left: 0, right: 0, top: 7, bottom: 0 },
    tableFontSize = 5,
    verticalCenter,
    zoom = true,
    children,
    ...props
  }
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
    const move = getBestDropMove(event, context, legalMoves)
    if (move !== undefined) {
      if (isMoveItemsAtOnce(move)) {
        for (const index of move.indexes) {
          play(dropItemMove(move.itemType, index, 0), { transient: true })
        }
      } else if (dataIsDisplayedItem(event.active.data.current)) {
        const item = event.active.data.current
        const { type, index, displayIndex } = item
        play(dropItemMove(type, index, displayIndex), { transient: true })
      }
      play(move)
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
  const minScale = (100 - vm) / tableFontSize / (yMax - yMin)
  const maxScale = minScale > 0.9 ? minScale : 1
  const ratio = (xMax - xMin) / (yMax - yMin)
  const ratioWithMargins = ((100 - vm) * ratio + hm) / 100
  const panning = useMemo(() => ({ disabled: dragging }), [dragging])
  const wrapperStyle = useMemo(() => computedWrapperClass(margin, vm, hm, ratio, verticalCenter), [margin, vm, hm, ratio])
  const modifiers = useMemo(() => snapToCenter ? [snapCenterToCursor] : undefined, [snapToCenter])
  const boundaries = useMemo(() => ({xMin, xMax, yMin, yMax}), [xMin, xMax, yMin, yMax])

  const tableContent = (
    <div css={[
      tableCss(xMin, xMax, yMin, yMax),
      zoom ? fontSizeCss(tableFontSize) : noZoomTableCss(xMin, xMax, yMin, yMax, vm, hm),
      perspective && perspectiveCss(perspective)
    ]} {...props}>
      <GameMaterialDisplay boundaries={boundaries}>
        {children}
      </GameMaterialDisplay>
    </div>
  )

  const contextValue = useMemo(() => ({ zoom }), [zoom])

  return (
    <GameTableContext.Provider value={contextValue}>
      <DndContext collisionDetection={collisionAlgorithm} measuring={{ draggable: { measure: getClientRect }, droppable: { measure: getClientRect } }}
                  modifiers={modifiers} sensors={sensors}
                  onDragStart={() => setDragging(true)} onDragEnd={onDragEnd} onDragCancel={() => setDragging(false)}>
        <Global styles={[ratioFontSize(ratioWithMargins), wrapperStyle]}/>
        {zoom ? (
          <TransformWrapper ref={ref} minScale={minScale} maxScale={maxScale} initialScale={minScale}
                            centerOnInit={true} wheel={wheel} smooth={false} panning={panning} disablePadding doubleClick={doubleClick}>
            <TransformComponent wrapperClass="wrapperClass">
              <ZoomScaleProvider>
                {tableContent}
              </ZoomScaleProvider>
            </TransformComponent>
          </TransformWrapper>
        ) : (
          <div className="wrapperClass" css={noZoomContainerCss}>
            <NoZoomScaleProvider>
              {tableContent}
            </NoZoomScaleProvider>
          </div>
        )}
      </DndContext>
    </GameTableContext.Provider>
  )
}

const computedWrapperClass = (margin: any, vm: number, hm: number, ratio: number, verticalCenter?: boolean) => css`
  .wrapperClass {
    position: absolute;
    margin: ${margin.top}em ${margin.right}em ${margin.bottom}em ${margin.left}em;
    transform-style: preserve-3d;
    height: ${verticalCenter ? `calc(100% - ${vm}em)` : `min(100% - ${vm}em, (100vw - ${hm}em) / ${ratio})`};
    height: ${verticalCenter ? `calc(100% - ${vm}em)` : `min(100% - ${vm}em, (100dvw - ${hm}em) / ${ratio})`};
    width: calc(100vw - ${hm}em);
    width: calc(100dvw - ${hm}em);
    overflow: visible;
  }
`

const ratioFontSize = (ratio: number) => css`
  body {
    font-size: 1vh;
    font-size: 1dvh;
    @media (max-aspect-ratio: ${ratio}/1) {
      font-size: calc(1vw / ${ratio});
      font-size: calc(1dvw / ${ratio});
    }
  }
`

const tableCss = (xMin: number, xMax: number, yMin: number, yMax: number) => css`
  transform-style: preserve-3d;
  width: ${xMax - xMin}em;
  height: ${yMax - yMin}em;
`

const noZoomContainerCss = css`
  display: flex;
  align-items: center;
  justify-content: center;
`

const noZoomTableCss = (xMin: number, xMax: number, yMin: number, yMax: number, vm: number, hm: number) => {
  const tableWidth = xMax - xMin
  const tableHeight = yMax - yMin
  // Margins are in em relative to body font-size (1dvh), so vm em = vm dvh
  const heightBasedFontSize = (100 - vm) / tableHeight
  return css`
    font-size: min(${heightBasedFontSize}dvh, calc((100dvw - ${hm}dvh) / ${tableWidth}));
  `
}
