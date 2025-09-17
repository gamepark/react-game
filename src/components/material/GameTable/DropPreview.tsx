import { DragMoveEvent, useDndMonitor } from '@dnd-kit/core'
import { css } from '@emotion/react'
import { isMoveItem, Location, MaterialMove } from '@gamepark/rules-api'
import { HTMLAttributes, useCallback, useState } from 'react'
import { useLegalMoves, useMaterialContext } from '../../../hooks'
import { MaterialComponent } from '../MaterialComponent'
import { getBestDropMove } from '../utils/getBestDropMove'

export const DropPreview = (props: HTMLAttributes<HTMLDivElement>) => {
  const context = useMaterialContext()
  const legalMoves = useLegalMoves()
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
  useDndMonitor({ onDragStart, onDragEnd, onDragMove })

  if (bestMove && isMoveItem(bestMove) && location && context.locators[location.type]?.showDropPreview(bestMove, context)) {
    const type = bestMove.itemType
    const index = bestMove.itemIndex
    const item = context.rules.material(type).getItem(index)
    const futureItem = { ...item, location: { type: location.type, ...bestMove.location } }
    const description = context.material[type]!
    const itemContext = { ...context, type, index, displayIndex: 0 }
    return <div {...props}>
      <MaterialComponent type={type} itemIndex={index} itemId={item.id} css={previewCss} preview
                         style={{ transform: 'translateZ(5em) ' + description.getItemTransform(futureItem, itemContext).join(' ') }}
      />
    </div>
  }

  return <div {...props}></div>
}

const previewCss = css`
  position: absolute;
`

function dataIsLocation<P extends number = number, L extends number = number>(data?: Record<string, any>): data is Location<P, L> {
  return typeof data?.type === 'number'
}
