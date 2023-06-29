/** @jsxImportSource @emotion/react */
import { BaseContext, PlaceItemContext } from '../../../locators'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useLegalMoves, usePlay, usePlayerId, useRules, useZoomToElements } from '../../../hooks'
import { closeRulesDisplay, DisplayedItem, displayMaterialRules, MaterialMove, MaterialRules } from '@gamepark/rules-api'
import { isMoveThisItem, isMoveThisItemToLocation } from '../utils'
import { MaterialComponent } from '../MaterialComponent'
import { pointerCursorCss, transformCss } from '../../../css'
import { DraggableMaterial, isDraggedItem } from '../DraggableMaterial'
import { MaterialRulesDialog } from '../../dialogs'
import { DragStartEvent, useDndMonitor } from '@dnd-kit/core'
import { css } from '@emotion/react'
import { gameContext } from '../../GameProvider'
import { MaterialTutorialDisplay } from '../../tutorial/MaterialTutorialDisplay'
import { useTutorialStep } from '../../../hooks/useTutorialStep'
import { countTutorialFocusRefs, isItemFocus, isStaticItem, TutorialStepType } from '../../tutorial'
import equal from 'fast-deep-equal'

export const GameMaterialDisplay = () => {
  const context = useContext(gameContext)
  const material = context.material ?? {}
  const locators = context.locators ?? {}
  const player = usePlayerId()
  const rules = useRules<MaterialRules>()
  const legalMoves = useLegalMoves<MaterialMove>()
  const play = usePlay()
  const tutorialStep = useTutorialStep()
  const tutorialPopupStep = tutorialStep?.type === TutorialStepType.Popup ? tutorialStep : undefined
  const tutorialFocus = rules?.game ? tutorialPopupStep?.focus?.(rules?.game) : undefined

  const [draggedItem, setDraggedItem] = useState<DisplayedItem>()
  useDndMonitor({
    onDragStart: (event: DragStartEvent) => isDraggedItem(event.active.data.current) && setDraggedItem(event.active.data.current),
    onDragEnd: () => setDraggedItem(undefined)
  })

  const zoomToElements = useZoomToElements()
  const focusRefs = useRef<Set<HTMLElement>>(new Set())
  const [readyToFocus, setReadyToFocus] = useState(false)
  useEffect(() => {
    focusRefs.current = new Set()
    setReadyToFocus(false)
  }, [tutorialStep])
  useEffect(() => {
    if (readyToFocus) {
      const scale = tutorialPopupStep?.zoom ? 1 / tutorialPopupStep.zoom : undefined
      zoomToElements(Array.from(focusRefs.current), scale)
    }
  }, [readyToFocus])
  const addFocusRef = useCallback((ref: HTMLElement | null) => {
    if (!ref) return
    focusRefs.current.add(ref)
    if (countTutorialFocusRefs(tutorialFocus) === focusRefs.current.size) {
      setReadyToFocus(true)
    }
  }, [tutorialFocus])

  if (!rules) return <></>
  const game = rules?.game
  const commonContext: BaseContext = { game, player, material, locators }

  return <>
    {Object.entries(material).map(([stringType, description]) => {
      const type = parseInt(stringType)
      return description.getItems(game, player).map(item => {
        const locator = locators[item.location.type]
        const innerLocations = description.getLocations(item, commonContext)
        return [...Array(item.quantity ?? 1)].map((_, index) => {
          const context: PlaceItemContext = { ...commonContext, type, index }
          const focus = isStaticItem(tutorialFocus) && tutorialFocus.type === type && equal(tutorialFocus.item, item)
          return <MaterialComponent key={`${stringType}_${index}`} type={type} itemId={item.id}
                                    playDown={tutorialPopupStep && !focus}
                                    ref={focus ? addFocusRef : undefined}
                                    css={[pointerCursorCss, transformCss(...locator.transformItem(item, context))]}
                                    onShortClick={() => play(displayMaterialRules(type, index, item), { local: true })}>
            {innerLocations.map(location =>
              locators[location.type].createLocation(location, { ...commonContext, parentItemId: item.id })
            )}
          </MaterialComponent>
        })
      })
    })}
    {rules && game && Object.entries(game.items).map(([stringType, items]) => {
      if (!items) return null
      const type = parseInt(stringType)
      return items.map((item, index) => {
        const locator = locators[item.location.type]
        const description = material[type]
        const innerLocations = description.getLocations(item, commonContext)
        return [...Array(item.quantity ?? 1)].map((_, displayIndex) => {
          const context: PlaceItemContext = { ...commonContext, type, index: displayIndex }
          if (locator.hide(item, context)) return null
          const itemMoves = legalMoves.filter(move => rules.isMoveTrigger(move, move => isMoveThisItem(move, type, index)))
          const draggingToSameLocation = !!draggedItem && legalMoves.some(move =>
            isMoveThisItemToLocation(move, draggedItem.type, draggedItem.index, item.location)
          )
          return <DraggableMaterial key={`${type}_${index}_${displayIndex}`}
                                    type={type} item={item} index={index} displayIndex={displayIndex}
                                    disabled={!itemMoves.length}
                                    playDown={tutorialPopupStep && !isItemFocus(type, index, tutorialFocus)}
                                    ref={isItemFocus(type, index, tutorialFocus) ? addFocusRef : undefined}
                                    postTransform={locator.transformItem(item, context).join(' ')}
                                    css={draggingToSameLocation && noPointerEvents}
                                    onShortClick={() => play(displayMaterialRules(type, index, item), { local: true })}
                                    onLongClick={itemMoves.length === 1 ?
                                      () => play(itemMoves[0], { delayed: rules.isUnpredictableMove(itemMoves[0], player) })
                                      : undefined}>
            {innerLocations.map(location =>
              locators[location.type].createLocation(location, { ...commonContext, parentItemId: item.id })
            )}
          </DraggableMaterial>
        })
      })
    })}
    {Object.values(locators).map(locator =>
      locator.getLocations(commonContext).map(location =>
        locator.createLocation(location, commonContext)
      )
    )}
    <MaterialRulesDialog open={!!game?.rulesDisplay} close={() => play(closeRulesDisplay, { local: true })}/>
    {game?.tutorialStep !== undefined && <MaterialTutorialDisplay/>}
  </>
}

const noPointerEvents = css`
  pointer-events: none;
`
