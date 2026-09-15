import { CollisionDetection, DndContext, DragEndEvent, getClientRect, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { css, Global } from '@emotion/react'
import { isMoveItemsAtOnce, MaterialMoveBuilder } from '@gamepark/rules-api'
import { FC, HTMLAttributes, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react'
import { ReactZoomPanPinchContentRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { fontSizeCss, perspectiveCss } from '../../../css'
import { useDraggedItem, useLegalMoves, useMaterialContext, usePlay } from '../../../hooks'
import { calculateBounds, getMouseBoundedPosition } from '../../../utilities/zoom-pan-pinch'
import { dataIsDisplayedItem } from '../DraggableMaterial'
import { getBestDropMove } from '../utils/getBestDropMove'
import { DraggedItemProvider } from './DraggedItemProvider'
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

type Margin = NonNullable<GameTableProps['margin']>

const defaultMargin: Margin = { left: 0, right: 0, top: 7, bottom: 0 }
const wheel = { step: 0.05 }
const doubleClick = { disabled: true }
const pointerSensorOptions = { activationConstraint: { distance: 2 } }
const measuring = { draggable: { measure: getClientRect }, droppable: { measure: getClientRect } }
const enabledPanning = { disabled: false }
const disabledPanning = { disabled: true }

/**
 * The GameTable renders the DndContext, so it cannot read the dragged item itself: this reads it from inside.
 */
const DraggingState = ({ children }: { children: (dragging: boolean) => ReactNode }) => children(useDraggedItem() !== undefined)

export const GameTable: FC<GameTableProps> = (
  {
    collisionAlgorithm,
    snapToCenter = true,
    perspective,
    xMin,
    xMax,
    yMin,
    yMax,
    margin = defaultMargin,
    tableFontSize = 5,
    verticalCenter,
    zoom,
    children,
    ...props
  }
) => {
  // Dimensions calculations
  const tableWidth = xMax - xMin
  const tableHeight = yMax - yMin
  const hm = margin.left + margin.right
  const vm = margin.top + margin.bottom
  const ratio = tableWidth / tableHeight
  const ratioWithMargins = ((100 - vm) * ratio + hm) / 100

  // Scale calculations
  const minScale = (100 - vm) / tableFontSize / tableHeight
  const maxScale = minScale > 0.9 ? minScale : 1
  const enableZoom = zoom ?? minScale < 0.9

  // Drag & drop
  const sensors = useSensors(useSensor(PointerSensor, pointerSensorOptions))
  const context = useMaterialContext()
  const play = usePlay()
  const legalMoves = useLegalMoves()

  const onDragEnd = useCallback((event: DragEndEvent) => {
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

  // Zoom resize handler
  const zoomRef = useRef<ReactZoomPanPinchContentRef>(null)
  useEffect(() => {
    if (!enableZoom) return
    const handler = () => {
      const zoomPanPinch = zoomRef.current?.instance
      if (!zoomPanPinch?.bounds) return
      const { positionX, positionY, scale } = zoomPanPinch.state
      const bounds = calculateBounds(zoomPanPinch, scale)
      const { x, y } = getMouseBoundedPosition(positionX, positionY, bounds, true, 0, 0, zoomPanPinch.wrapperComponent)
      zoomPanPinch.setState(scale, x, y)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [enableZoom])

  // When in-app zoom is enabled, disable native zoom; otherwise allow pinch-to-zoom
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]')
    if (!viewport) return
    if (enableZoom) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no')
    } else {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0')
    }
    if (enableZoom) return
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault()
    }
    document.addEventListener('wheel', handler, { passive: false })
    return () => document.removeEventListener('wheel', handler)
  }, [enableZoom])

  // Memoized values
  const wrapperStyle = useMemo(() => computedWrapperClass(margin, vm, hm, ratio, verticalCenter), [margin, vm, hm, ratio, verticalCenter])
  const modifiers = useMemo(() => snapToCenter ? [snapCenterToCursor] : undefined, [snapToCenter])
  const boundaries = useMemo(() => ({ xMin, xMax, yMin, yMax }), [xMin, xMax, yMin, yMax])
  const contextValue = useMemo(() => ({ zoom: enableZoom }), [enableZoom])

  // `centerZoomedOut` below keeps the free space split evenly on both sides once the table is smaller than the
  // wrapper, which happens on every screen wider than the table ratio. Without it, react-zoom-pan-pinch v4 gives
  // the whole slack to the right (bounds [0, diff] instead of [diff/2, diff/2]), and `disablePadding` then pins the
  // position to 0, so the table sticks to the left edge. v3 centered by default: this restores that behaviour.
  const tableContent = (
    <div css={[
      tableCss(tableWidth, tableHeight),
      enableZoom ? fontSizeCss(tableFontSize) : noZoomTableCss(tableWidth, tableHeight, vm, hm),
      perspective && perspectiveCss(perspective)
    ]} {...props}>
      <GameMaterialDisplay boundaries={boundaries}>
        {children}
      </GameMaterialDisplay>
    </div>
  )

  return (
    <GameTableContext.Provider value={contextValue}>
      <DndContext collisionDetection={collisionAlgorithm} measuring={measuring}
                  modifiers={modifiers} sensors={sensors} onDragEnd={onDragEnd}>
        <DraggedItemProvider>
          <Global styles={[ratioFontSize(ratioWithMargins), wrapperStyle, !enableZoom && nativeZoomCss]}/>
          {enableZoom ? (
            <DraggingState>{dragging =>
              <TransformWrapper ref={zoomRef} minScale={minScale} maxScale={maxScale} initialScale={minScale}
                                centerOnInit={true} centerZoomedOut={true} wheel={wheel} smooth={false}
                                panning={dragging ? disabledPanning : enabledPanning}
                                disablePadding doubleClick={doubleClick}>
                <TransformComponent wrapperClass="wrapperClass" contentStyle={{ transformStyle: 'preserve-3d' }}>
                  <ZoomScaleProvider>
                    {tableContent}
                  </ZoomScaleProvider>
                </TransformComponent>
              </TransformWrapper>
            }</DraggingState>
          ) : (
            <div className="wrapperClass" css={noZoomContainerCss}>
              <NoZoomScaleProvider>
                {tableContent}
              </NoZoomScaleProvider>
            </div>
          )}
        </DraggedItemProvider>
      </DndContext>
    </GameTableContext.Provider>
  )
}

const computedWrapperClass = (margin: Margin, vm: number, hm: number, ratio: number, verticalCenter?: boolean) => css`
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

const tableCss = (width: number, height: number) => css`
  transform-style: preserve-3d;
  width: ${width}em;
  height: ${height}em;
`

const nativeZoomCss = css`
  #root {
    touch-action: pinch-zoom;
  }
`

const noZoomContainerCss = css`
  display: flex;
  align-items: center;
  justify-content: center;
`

const noZoomTableCss = (tableWidth: number, tableHeight: number, vm: number, hm: number) => {
  const heightBasedFontSize = (100 - vm) / tableHeight
  return css`
    font-size: min(${heightBasedFontSize}dvh, calc((100dvw - ${hm}dvh) / ${tableWidth}));
  `
}
