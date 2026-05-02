import { useDndContext, useDndMonitor } from '@dnd-kit/core'
import { MaterialMoveBuilder } from '@gamepark/rules-api'
import { useCallback, useEffect, useRef } from 'react'
import { usePlay } from './usePlay'
import { usePlayerId } from './usePlayerId'

/**
 * Function called at drag start to compute the view value to assign
 * to `game.view`. Return `undefined` to skip the view switch (e.g. the
 * dragging player is already viewed).
 */
export type ViewSwitchResolver = (me: number) => number | undefined

/** Default delay (ms) before refreshing dnd-kit's drop-zone rects.
 *  Should be greater than the longest layout transition the game uses. */
const DEFAULT_REMEASURE_DELAY = 300

/**
 * Hook for games that auto-switch the viewed player when a drag starts.
 *
 * It plays a transient `changeView` move at drag start using the value
 * returned by `resolve`, then refreshes dnd-kit's drop-zone rects after
 * `remeasureDelay` ms — long enough for the layout transition to have
 * finished. This lets games keep a smooth CSS transition on view
 * switches without breaking drag-and-drop detection (dnd-kit caches
 * rects at drag start by default).
 *
 * Pass a custom `resolve` to encode multi-slot views (left/right, etc).
 * For the simple case (just switch to the dragging player), the default
 * resolver returns the current player id.
 */
export const useAutoViewOnDrag = (
  resolve: ViewSwitchResolver = (me) => me,
  remeasureDelay: number = DEFAULT_REMEASURE_DELAY
) => {
  const me = usePlayerId<number>()
  const play = usePlay()
  const { measureDroppableContainers, droppableContainers } = useDndContext()

  const remeasureTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const remeasure = useCallback(() => {
    measureDroppableContainers(droppableContainers.getEnabled().map((c) => c.id))
  }, [measureDroppableContainers, droppableContainers])

  const onDragStart = useCallback(() => {
    if (me === undefined) return
    const view = resolve(me)
    if (view === undefined) return
    play(MaterialMoveBuilder.changeView(view), { transient: true })

    if (remeasureTimeout.current) clearTimeout(remeasureTimeout.current)
    remeasureTimeout.current = setTimeout(() => {
      remeasure()
      remeasureTimeout.current = null
    }, remeasureDelay)
  }, [me, resolve, play, remeasure, remeasureDelay])

  const cleanup = useCallback(() => {
    if (remeasureTimeout.current) {
      clearTimeout(remeasureTimeout.current)
      remeasureTimeout.current = null
    }
  }, [])

  useEffect(() => cleanup, [cleanup])

  useDndMonitor({ onDragStart, onDragEnd: cleanup, onDragCancel: cleanup })
}
