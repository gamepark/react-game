import { DragMoveEvent, useDndContext, useDndMonitor } from '@dnd-kit/core'
import { css } from '@emotion/react'
import { GridBoundaries, isMoveItem, Location, MaterialMove } from '@gamepark/rules-api'
import { useCallback, useState } from 'react'
import { useLegalMoves, useMaterialContext } from '../../../hooks'
import { getLocationOriginCss } from '../../../locators'
import { MaterialComponent } from '../MaterialComponent'
import { getBestDropMove } from '../utils/getBestDropMove'

export const DropPreview = ({ boundaries }: { boundaries: GridBoundaries }) => {
  const context = useMaterialContext()
  const legalMoves = useLegalMoves()
  const { active } = useDndContext()
  const [bestMove, setBestMove] = useState<MaterialMove>()
  const [location, setLocation] = useState<Location>()
  const onDragStart = useCallback(() => setBestMove(undefined), [])
  const onDragMove = useCallback((event: DragMoveEvent) => {
    if (event.over && dataIsLocation(event.over.data.current)) {
      setLocation(event.over.data.current)
    }
    setBestMove(getBestDropMove(event, context, legalMoves))
  }, [context, legalMoves])
  const onDragEnd = useCallback(() => setBestMove(undefined), [])
  useDndMonitor({ onDragStart, onDragEnd, onDragMove, onDragCancel: onDragEnd })

  // Only show the preview while a drag is actually active. `active` comes from dnd-kit's reactive context and
  // resets to null as soon as the drag ends (drop, cancel, or the GameTable stuck-drag safety net), regardless
  // of whether our onDragEnd/onDragCancel monitor callback was delivered. Relying on the callback alone (like
  // before) leaves the ghost card stuck on the table whenever that end-of-drag event is missed — the same
  // class of bug that left drop areas stuck before they were switched to dnd-kit's reactive state.
  if (active && bestMove && isMoveItem(bestMove) && location && context.locators[location.type]?.showDropPreview(bestMove, context)) {
    const type = bestMove.itemType
    const index = bestMove.itemIndex
    const item = context.rules.material(type).getItem(index)
    const futureItem = { ...item, location: { type: location.type, ...bestMove.location } }
    const description = context.material[type]!
    const locator = context.locators[futureItem.location.type]
    const itemContext = { ...context, type, index, displayIndex: 0 }
    return <div css={getLocationOriginCss(boundaries, locator?.getLocationOrigin(futureItem.location, itemContext))}>
      <MaterialComponent type={type} itemIndex={index} displayIndex={0} itemId={item.id} css={previewCss} preview
                         style={{ transform: 'translateZ(5em) ' + description.getItemTransform(futureItem, itemContext).join(' ') }}
      />
    </div>
  }

  return null
}

const previewCss = css`
  position: absolute;
`

function dataIsLocation<P extends number = number, L extends number = number>(data?: Record<string, any>): data is Location<P, L> {
  return typeof data?.type === 'number'
}
