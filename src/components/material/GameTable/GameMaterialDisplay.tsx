/** @jsxImportSource @emotion/react */
import { MaterialDescription } from '../MaterialDescription'
import { ItemLocatorCreator, PlaceItemContext } from '../../../locators'
import { HTMLAttributes, useMemo, useState } from 'react'
import { useGame, useLegalMoves, usePlay, usePlayerId, useRules } from '../../../hooks'
import { closeRulesDisplay, displayMaterialRules, MaterialGame, MaterialMove, MaterialRules } from '@gamepark/rules-api'
import mapValues from 'lodash.mapvalues'
import pickBy from 'lodash.pickby'
import { isMoveOnItem, isMoveThisItem, isMoveThisItemToLocation } from '../utils'
import { MaterialComponent } from '../MaterialComponent'
import { getPositionTransforms, pointerCursorCss, transformCss } from '../../../css'
import { DraggableItemData, DraggableMaterial, isDraggableItemData } from '../DraggableMaterial'
import { RulesDialog } from '../../dialogs'
import { DragStartEvent, useDndMonitor } from '@dnd-kit/core'
import { css } from '@emotion/react'

type GameMaterialDisplayProps<P extends number = number, M extends number = number, L extends number = number> = {
  material: Record<M, MaterialDescription>
  locators: Record<L, ItemLocatorCreator<P, M, L>>
} & HTMLAttributes<HTMLDivElement>

export const GameMaterialDisplay = ({ material, locators }: GameMaterialDisplayProps) => {
  const game = useGame<MaterialGame>()
  const player = usePlayerId()
  const rules = useRules<MaterialRules>()
  const legalMoves = useLegalMoves<MaterialMove>()
  const play = usePlay()
  const locatorsMap = useMemo(() => mapValues(locators, locator => new locator(material, locators)), [])

  const [draggedItem, setDraggedItem] = useState<DraggableItemData>()
  useDndMonitor({
    onDragStart: (event: DragStartEvent) => isDraggableItemData(event.active.data.current) && setDraggedItem(event.active.data.current),
    onDragEnd: () => setDraggedItem(undefined)
  })

  if (!game || !rules) return <></>

  return <>
    {Object.entries(material).map(([stringType, description]) => {
      if (!description.items) return null
      const type = parseInt(stringType)
      const innerLocators = pickBy(locatorsMap, locator => locator.parentItemType === type)
      const innerLocations = Object.keys(innerLocators).map(type => parseInt(type))
      return description.items(game, player).map((item, index) => {
        const legalMovesTo = innerLocations.length > 0 ? legalMoves.filter(move => rules.isMoveTrigger(move, move => isMoveOnItem(move, item.id, innerLocations))) : undefined
        return <MaterialComponent key={`${stringType}_${index}`} description={description} itemId={item.id}
                                  locators={innerLocators} legalMovesTo={legalMovesTo} rules={rules}
                                  css={[pointerCursorCss, transformCss(`translate(-50%, -50%)`, ...getPositionTransforms(item.position, item.rotation))]}
                                  onShortClick={() => play(displayMaterialRules(type, index, item), { local: true })}/>
      })
    })}
    {rules && game && Object.entries(game.items).map(([stringType, items]) => {
      if (!items) return null
      const type = parseInt(stringType)
      const description = material[type] as MaterialDescription
      return items.map((item, itemIndex) => {
        const locator = locatorsMap[item.location.type]
        return [...Array(item.quantity ?? 1)].map((_, index) => {
          const context: PlaceItemContext = { game, type, index, itemIndex, player }
          if (locator.hide(item, context)) return null
          const itemMoves = legalMoves.filter(move => rules.isMoveTrigger(move, move => isMoveThisItem(move, type, itemIndex)))
          const draggingToSameLocation = !!draggedItem && legalMoves.some(move =>
            isMoveThisItemToLocation(move, draggedItem.type, draggedItem.index, item.location)
          )
          return <DraggableMaterial key={`${type}_${itemIndex}_${index}`}
                                    id={`${type}_${itemIndex}_${index}`}
                                    data={{ item, type, index: itemIndex }}
                                    disabled={!itemMoves.length}
                                    preTransform="translate(-50%, -50%)"
                                    postTransform={locator.place(item, context)}
                                    rules={rules}
                                    description={description}
                                    css={draggingToSameLocation && noPointerEvents}
                                    onShortClick={() => play(displayMaterialRules(type, itemIndex, item), { local: true })}
                                    onLongClick={itemMoves.length === 1 ?
                                      () => play(itemMoves[0], { delayed: rules.isUnpredictableMove(itemMoves[0], player) })
                                      : undefined}/>
        })
      })
    })}
    <RulesDialog open={!!game?.rulesDisplay} close={() => play(closeRulesDisplay, { local: true })}
                 game={game} legalMoves={legalMoves} rules={rules} material={material} locators={locatorsMap}/>
  </>
}

const noPointerEvents = css`
  pointer-events: none;
`
