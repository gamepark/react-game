import { CollisionDetection, DndContext, DragEndEvent, DragStartEvent, getClientRect, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
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

type Margin = NonNullable<GameTableProps['margin']>

const defaultMargin: Margin = { left: 0, right: 0, top: 7, bottom: 0 }
const wheel = { step: 0.05 }
const doubleClick = { disabled: true }
const dragSensorOptions = { activationConstraint: { distance: 2 } }
const measuring = { draggable: { measure: getClientRect }, droppable: { measure: getClientRect } }

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
  const [dragging, setDragging] = useState(false)
  const draggingRef = useRef(false)
  const draggingPointerType = useRef<string | undefined>(undefined)
  const isTouchDrag = () => draggingRef.current && draggingPointerType.current !== 'mouse'
  // On iOS Safari a `touch-action: none` CSS rule is NOT enough for dnd-kit's PointerSensor to claim a touch
  // drag: the browser keeps the gesture and never delivers move events, so tiles can't be dragged at all.
  // dnd-kit's TouchSensor works around this (its `setup()` installs a non-passive `touchmove` listener so that
  // `preventDefault()` is honoured, "required for iOS Safari"). So we drive touch with TouchSensor and mouse
  // with MouseSensor instead of the unified PointerSensor.
  const sensors = useSensors(useSensor(MouseSensor, dragSensorOptions), useSensor(TouchSensor, dragSensorOptions))
  const context = useMaterialContext()
  const play = usePlay()
  const legalMoves = useLegalMoves()

  const onDragStart = useCallback((event: DragStartEvent) => {
    // MouseSensor activates with a MouseEvent, TouchSensor with a TouchEvent (which has no `pointerType`).
    const activator = event.activatorEvent
    draggingPointerType.current = activator && 'touches' in activator ? 'touch' : 'mouse'
    draggingRef.current = true
    setDragging(true)
  }, [])
  const onDragCancel = useCallback(() => {
    draggingRef.current = false
    setDragging(false)
  }, [])
  const onDragEnd = useCallback((event: DragEndEvent) => {
    draggingRef.current = false
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

  // Mobile Safari fires a window `resize` when its toolbar shows/hides, which happens on the very first
  // move of a touch drag (and on iOS < 17 / iPad it is systematic). dnd-kit's PointerSensor cancels the
  // active drag on window `resize`, so on those devices a tile can't be dragged at all: the drag dies the
  // instant it starts. We register this listener once (at mount, so it runs before dnd-kit's own drag-time
  // `resize` listener) and, while a *touch* drag is in progress, stop the event before the sensor sees it.
  // Mouse drags are never affected (a genuine window resize still cancels them as before).
  useEffect(() => {
    const swallowResizeWhileTouchDragging = (event: Event) => {
      if (isTouchDrag()) event.stopImmediatePropagation()
    }
    window.addEventListener('resize', swallowResizeWhileTouchDragging, { capture: true })
    return () => window.removeEventListener('resize', swallowResizeWhileTouchDragging, { capture: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Safety net for stuck drags.
  // dnd-kit's PointerSensor only ends a drag on `pointerup`/`pointercancel` received by the document, or on
  // window `resize`/`visibilitychange`. It does NOT listen for the window losing focus. So if the pointer is
  // released outside the page or the window loses focus mid-drag without going hidden (frequent on some
  // Linux / Edge setups, and on touch when the browser hands focus to its own UI), none of those events fire:
  // the drag stays active and every drop area shown while dragging (e.g. a large "recycle" zone) remains stuck
  // on top of the cards.
  // On `blur` we force dnd-kit to cancel through its own teardown by dispatching a `pointercancel` on the
  // document, which resets the dragged item position, the panning lock and the drop areas all at once.
  // Caveat: on iOS Safari `blur` also fires during a *live* touch drag (toolbar showing/hiding on the first
  // move, system gestures), so cancelling immediately would spuriously kill the drag. But a genuinely stuck
  // drag has no more pointer activity, whereas a live drag keeps emitting moves. So on `blur` we defer and
  // only cancel if no move arrives shortly after — this cleans up truly stuck drags (mouse and touch) without
  // killing live iOS drags.
  useEffect(() => {
    if (!dragging) return
    let timeout: ReturnType<typeof setTimeout> | undefined
    const clear = () => {
      if (timeout !== undefined) {
        clearTimeout(timeout)
        timeout = undefined
      }
    }
    const onBlur = () => {
      if (timeout !== undefined) return
      timeout = setTimeout(() => {
        timeout = undefined
        document.dispatchEvent(new PointerEvent('pointercancel'))
      }, 300)
    }
    window.addEventListener('blur', onBlur)
    window.addEventListener('pointermove', clear, { capture: true })
    window.addEventListener('touchmove', clear, { capture: true })
    return () => {
      clear()
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('pointermove', clear, { capture: true })
      window.removeEventListener('touchmove', clear, { capture: true })
    }
  }, [dragging])

  // Zoom resize handler
  const zoomRef = useRef<ReactZoomPanPinchContentRef>(null)
  useEffect(() => {
    if (!enableZoom) return
    const handler = () => {
      const zoomPanPinch = zoomRef.current?.instance
      if (!zoomPanPinch?.bounds) return
      const { positionX, positionY, scale } = zoomPanPinch.transformState
      const bounds = calculateBounds(zoomPanPinch, scale)
      const { x, y } = getMouseBoundedPosition(positionX, positionY, bounds, true, 0, 0, zoomPanPinch.wrapperComponent)
      zoomPanPinch.setTransformState(scale, x, y)
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
  const panning = useMemo(() => ({ disabled: dragging }), [dragging])
  const wrapperStyle = useMemo(() => computedWrapperClass(margin, vm, hm, ratio, verticalCenter), [margin, vm, hm, ratio, verticalCenter])
  const modifiers = useMemo(() => snapToCenter ? [snapCenterToCursor] : undefined, [snapToCenter])
  const boundaries = useMemo(() => ({ xMin, xMax, yMin, yMax }), [xMin, xMax, yMin, yMax])
  const contextValue = useMemo(() => ({ zoom: enableZoom }), [enableZoom])

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
                  modifiers={modifiers} sensors={sensors}
                  onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
        <Global styles={[ratioFontSize(ratioWithMargins), wrapperStyle, !enableZoom && nativeZoomCss]}/>
        {enableZoom ? (
          <TransformWrapper ref={zoomRef} minScale={minScale} maxScale={maxScale} initialScale={minScale}
                            centerOnInit={true} wheel={wheel} smooth={false} panning={panning} disablePadding doubleClick={doubleClick}>
            <TransformComponent wrapperClass="wrapperClass" contentStyle={{ transformStyle: 'preserve-3d' }}>
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
