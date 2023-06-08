/** @jsxImportSource @emotion/react */
import { BaseContext, PlaceItemContext } from '../../../locators'
import { useContext, useState } from 'react'
import { useLegalMoves, usePlay, usePlayerId, useRules } from '../../../hooks'
import { closeRulesDisplay, DisplayedItem, displayMaterialRules, MaterialMove, MaterialRules } from '@gamepark/rules-api'
import pickBy from 'lodash.pickby'
import { isMoveOnItem, isMoveThisItem, isMoveThisItemToLocation } from '../utils'
import { MaterialComponent } from '../MaterialComponent'
import { pointerCursorCss, transformCss } from '../../../css'
import { DraggableMaterial, isDraggedItem } from '../DraggableMaterial'
import { RulesDialog } from '../../dialogs'
import { DragStartEvent, useDndMonitor } from '@dnd-kit/core'
import { css } from '@emotion/react'
import { gameContext } from '../../GameProvider'
import { useStocks } from '../../../hooks/useStocks'

export const GameMaterialDisplay = () => {
  const context = useContext(gameContext)
  const material = context.material ?? {}
  const locators = context.locators ?? {}
  const stocks = useStocks()
  const player = usePlayerId()
  const rules = useRules<MaterialRules>()
  const legalMoves = useLegalMoves<MaterialMove>()
  const play = usePlay()

  const [draggedItem, setDraggedItem] = useState<DisplayedItem>()
  useDndMonitor({
    onDragStart: (event: DragStartEvent) => isDraggedItem(event.active.data.current) && setDraggedItem(event.active.data.current),
    onDragEnd: () => setDraggedItem(undefined)
  })

  if (!rules) return <></>
  const game = rules?.game
  const commonContext: BaseContext = { game, player, material, locators }

  return <>
    {Object.entries(material).map(([stringType, description]) => {
      if (!description.items) return null
      const type = parseInt(stringType)
      const innerLocators = pickBy(locators, locator => locator.parentItemType === type)
      const innerLocations = Object.keys(innerLocators).map(type => parseInt(type))
      return description.items(game, player).map((item) => {
        const legalMovesTo = innerLocations.length > 0 ? legalMoves.filter(move => rules.isMoveTrigger(move, move => isMoveOnItem(move, item.id, innerLocations))) : undefined
        const locator = locators[item.location.type]
        return [...Array(item.quantity ?? 1)].map((_, index) => {
          const context: PlaceItemContext = { ...commonContext, type, index }
          return <MaterialComponent key={`${stringType}_${index}`} type={type} itemId={item.id} withLocations
                                    legalMovesTo={legalMovesTo}
                                    css={[pointerCursorCss, transformCss(locator.place(item, context))]}
                                    onShortClick={() => play(displayMaterialRules(type, index, item), { local: true })}/>
        })
      })
    })}
    {rules && game && Object.entries(game.items).map(([stringType, items]) => {
      if (!items) return null
      const type = parseInt(stringType)
      return items.map((item, index) => {
        const locator = locators[item.location.type]
        return [...Array(item.quantity ?? 1)].map((_, displayIndex) => {
          const context: PlaceItemContext = { ...commonContext, type, index: displayIndex }
          if (locator.hide(item, context)) return null
          const itemMoves = legalMoves.filter(move => rules.isMoveTrigger(move, move => isMoveThisItem(move, type, index)))
          const draggingToSameLocation = !!draggedItem && legalMoves.some(move =>
            isMoveThisItemToLocation(move, draggedItem.type, draggedItem.index, item.location, stocks)
          )
          return <DraggableMaterial key={`${type}_${index}_${displayIndex}`}
                                    type={type} item={item} index={index} displayIndex={displayIndex} withLocations
                                    disabled={!itemMoves.length}
                                    postTransform={locator.place(item, context)}
                                    css={draggingToSameLocation && noPointerEvents}
                                    onShortClick={() => play(displayMaterialRules(type, index, item), { local: true })}
                                    onLongClick={itemMoves.length === 1 ?
                                      () => play(itemMoves[0], { delayed: rules.isUnpredictableMove(itemMoves[0], player) })
                                      : undefined}/>
        })
      })
    })}
    {Object.entries(locators).map(([, locator]) =>
      locator && locator.createLocations && locator.createLocations(legalMoves, rules, commonContext)
    )}
    <RulesDialog open={!!game?.rulesDisplay} close={() => play(closeRulesDisplay, { local: true })}/>
  </>
}

const noPointerEvents = css`
  pointer-events: none;
`
