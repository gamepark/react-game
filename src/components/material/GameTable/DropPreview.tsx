import { DragMoveEvent, useDndMonitor } from '@dnd-kit/core'
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
    console.log(item.location.type, futureItem.location.type)
    const description = context.material[type]!
    const locator = context.locators[futureItem.location.type]
    const itemContext = { ...context, type, index, displayIndex: 0 }
    const locationOriginCss = getLocationOriginCss(boundaries, locator?.getLocationOrigin(futureItem.location, itemContext))
    console.log(locationOriginCss)
    return <div>
      <div css={locationOriginCss}>
        <MaterialComponent type={type} itemIndex={index} itemId={item.id} css={previewCss} preview
                           style={{ transform: 'translateZ(5em) ' + description.getItemTransform(futureItem, itemContext).join(' ') }}
        />
      </div>
    </div>
  }

  return <div></div>
}

const previewCss = css`
  position: absolute;
`

function dataIsLocation<P extends number = number, L extends number = number>(data?: Record<string, any>): data is Location<P, L> {
  return typeof data?.type === 'number'
}
