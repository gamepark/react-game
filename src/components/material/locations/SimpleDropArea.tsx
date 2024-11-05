/** @jsxImportSource @emotion/react */
import { useDroppable } from '@dnd-kit/core'
import { GamePageState } from '@gamepark/react-client'
import { Location, MaterialMove } from '@gamepark/rules-api'
import { forwardRef, HTMLAttributes, useMemo } from 'react'
import { mergeRefs } from 'react-merge-refs'
import { useSelector } from 'react-redux'
import { useLegalMoves, useMaterialContext, usePlay } from '../../../hooks'
import { findIfUnique } from '../../../utilities'
import { dataIsDisplayedItem } from '../DraggableMaterial'
import { DropAreaDescription } from './DropAreaDescription'
import { LocationComponent } from './LocationComponent'

export type SimpleDropAreaProps<P extends number = number, M extends number = number, L extends number = number> = {
  location: Location<P, L>
  description: DropAreaDescription<P, M, L>
} & HTMLAttributes<HTMLDivElement>

export const SimpleDropArea = forwardRef<HTMLDivElement, SimpleDropAreaProps>((
  { location, description, ...props }, ref
) => {
  const context = useMaterialContext()
  const material = context.material
  const play = usePlay<MaterialMove>()
  const legalMoves = useLegalMoves()
  const dropMoves = useMemo(() => legalMoves.filter(move => description?.isMoveToLocation(move, location, context)), [legalMoves, context])

  const onShortClick = useMemo(() => {
    const move = findIfUnique(legalMoves, move => description.canShortClick(move, location, context))
    if (move !== undefined) return () => play(move)

    const shortClickMove = description?.getShortClickMove(location, context)
    if (shortClickMove) return () => play(shortClickMove)

    const shortClickLocalMove = description?.getShortClickLocalMove(location, context)
    if (shortClickLocalMove) return () => play(shortClickLocalMove, { local: true })
  }, [legalMoves, context])

  const onLongClick = useMemo(() => {
    if (onShortClick) return
    const move = findIfUnique(legalMoves, move => description.canLongClick(move, location, context))
    if (move !== undefined) return () => play(move)
  }, [legalMoves, context])

  const canClickToMove = useMemo(() => {
    let short = 0, long = 0
    for (const move of legalMoves) {
      if (description?.canShortClick(move, location, context)) short++
      if (description?.canLongClick(move, location, context)) long++
      if (short > 1 && long > 1) return false
    }
    return short === 1 || long === 1
  }, [legalMoves, context])

  const { isOver, active, setNodeRef } = useDroppable({
    id: JSON.stringify(location),
    disabled: !dropMoves.length,
    data: location
  })

  const draggedItem = dataIsDisplayedItem(active?.data.current) ? active?.data.current : undefined
  const draggedItemContext = useMemo(() => draggedItem ? { ...context, ...draggedItem } : undefined, [draggedItem, context])
  const canDrop = useMemo(() => !!draggedItemContext && !!description && !!material && dropMoves.some(move =>
      material[draggedItemContext.type]?.canDrag(move, draggedItemContext) && description.canDrop(move, location, draggedItemContext)
    )
    , [draggedItemContext, dropMoves])

  const isAnimatingPlayerAction = useSelector((state: GamePageState) =>
    state.actions?.some(action => action.playerId === state.playerId && action.animation !== undefined)
  )

  return (
    <LocationComponent ref={mergeRefs([ref, setNodeRef])} location={location} description={description} canDrop={canDrop}
                       onShortClick={onShortClick} onLongClick={onLongClick}
                       highlight={(canDrop && !isOver) || (!draggedItem && canClickToMove && !isAnimatingPlayerAction)}
                       css={canDrop && isOver && description.dropHighlight} {...props}/>
  )
})

SimpleDropArea.displayName = 'SimpleDropArea'
