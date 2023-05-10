/** @jsxImportSource @emotion/react */
import { HTMLAttributes, MouseEvent, useCallback, useMemo, useRef, useState } from 'react'
import { useDrop } from 'react-dnd'
import { displayLocationRules, isInsideLocation, Location, MaterialMoveType, MaterialRules, MaterialRulesMove, MoveKind } from '@gamepark/rules-api'
import { css, keyframes } from '@emotion/react'
import { LongPressCallbackReason, useLongPress } from 'use-long-press'
import { ItemLocator } from '../../../locators'
import { usePlay } from '../../../hooks'
import { DragMaterialItem } from '../DraggableMaterial'
import { shineEffect } from '../../../css'

export type SimpleDropAreaProps<P extends number = number, M extends number = number, L extends number = number> = {
  locator: ItemLocator<P, M, L>
  location: Location<P, L>
  legalMoves: MaterialRulesMove<P, M, L>[]
  rules: MaterialRules<P, M, L>
  onLongPress?: () => void
} & HTMLAttributes<HTMLDivElement>

export const SimpleDropArea = <P extends number = number, M extends number = number, L extends number = number>(
  { locator, location, legalMoves, rules, onClick, onLongPress, ...props }: SimpleDropAreaProps<P, M, L>
) => {

  const play = usePlay<MaterialRulesMove<P, M, L>>()
  if (!onLongPress && legalMoves.length === 1) {
    onLongPress = () => play(legalMoves[0])
  }
  if (!onClick && locator.getLocationRules) {
    onClick = () => play(displayLocationRules(location), { local: true })
    if (!onLongPress) {
      onLongPress = () => play(displayLocationRules(location), { local: true })
    }
  }

  const acceptedItemTypes = useMemo(() =>
      Array.from(new Set(legalMoves.flatMap(move => getMoveItemTypes(move, rules).map(type => type.toString()))))
    , [legalMoves])

  const [{ item, canDrop, isOver }, ref] = useDrop<DragMaterialItem<P, M, L>, any, any>({
    accept: acceptedItemTypes,
    canDrop: ({ index, type }) => legalMoves.filter(move => isMoveThisItemHere(move, index, type, location, rules)).length === 1,
    drop: ({ index, type }) => {
      return legalMoves.find(move => isMoveThisItemHere(move, index, type, location, rules))
    },
    collect: (monitor) => ({
      item: monitor.getItem(),
      canDrop: monitor.canDrop(),
      isOver: monitor.isOver()
    })
  })

  const clicked = useRef(false)
  const [clicking, setClicking] = useState(false)
  const onShortClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (clicked.current) {
      if (onClick) {
        event.stopPropagation()
        onClick(event)
      }
    }
  }, [])

  const bind = useLongPress(() => onLongPress && onLongPress(), {
    cancelOnMovement: true,
    onStart: () => {
      if (onLongPress) {
        setClicking(true)
      }
      clicked.current = false
    },
    onFinish: () => setClicking(false),
    onCancel: (_, { reason }) => {
      setClicking(false)
      if (reason === LongPressCallbackReason.CancelledByRelease) {
        clicked.current = true
      }
    },
    filterEvents: event => !(event as MouseEvent).button // Ignore clicks on mouse buttons > 0
  })

  return <div ref={ref} onClick={onShortClick} {...bind()} {...props} css={[
    !item && (onClick || onLongPress) && hoverHighlight, clicking && clickingAnimation,
    (canDrop || (!item && legalMoves.length > 0)) && shineEffect,
    canDrop && isOver && dropHighlight
  ]}/>
}

const hoverHighlight = css`
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`

const clickingKeyframes = keyframes`
  from {
    background-color: rgba(255, 255, 255, 0.2);
  }
  to {
    background-color: rgba(0, 255, 0, 0.5);
  }
`

const clickingAnimation = css`
  animation: ${clickingKeyframes} 0.4s ease-in-out;
`

const dropHighlight = css`
  background-color: rgba(0, 255, 0, 0.5);
`

const getMoveItemTypes = <P extends number = number, M extends number = number, L extends number = number>(
  move: MaterialRulesMove<P, M, L>, rules: MaterialRules<P, M, L>
): number[] => {
  switch (move.kind) {
    case MoveKind.MaterialMove:
      return move.type === MaterialMoveType.Move ? [move.itemsType] : []
    case MoveKind.CustomMove:
      return rules.play(move).flatMap(move => getMoveItemTypes(move, rules))
    default:
      return []
  }
}

const isMoveThisItemHere = <P extends number = number, M extends number = number, L extends number = number>(
  move: MaterialRulesMove<P, M, L>, index: number, type: M, location: Location<P, L>, rules: MaterialRules<P, M, L>
): boolean => {
  switch (move.kind) {
    case MoveKind.MaterialMove:
      return move.type === MaterialMoveType.Move && move.itemsType === type && move.itemIndex === index && !!move.item.location && isInsideLocation(move.item.location, location)
    case MoveKind.CustomMove:
      return rules.play(move).some(move => isMoveThisItemHere(move, index, type, location, rules))
    default:
      return false
  }
}
