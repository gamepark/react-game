/** @jsxImportSource @emotion/react */
import { BaseContext, PlaceItemContext } from '../../../locators'
import { useCallback, useContext, useMemo, useRef, useState } from 'react'
import { useLegalMoves, usePlay, usePlayerId, useRules, useZoomToElements } from '../../../hooks'
import { closeRulesDisplay, DisplayedItem, displayMaterialRules, MaterialMove, MaterialRules, XYCoordinates } from '@gamepark/rules-api'
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
import { countTutorialFocusRefs, isItemFocus, isLocationFocus, isStaticItemFocus, TutorialStepType } from '../../tutorial'
import { SimpleDropArea } from '../DropAreas'

export const GameMaterialDisplay = () => {
  const context = useContext(gameContext)
  const material = context.material ?? {}
  const locators = context.locators ?? {}
  const player = usePlayerId()
  const rules = useRules<MaterialRules>()
  const legalMoves = useLegalMoves<MaterialMove>()
  const play = usePlay()

  const [draggedItem, setDraggedItem] = useState<DisplayedItem>()
  useDndMonitor({
    onDragStart: (event: DragStartEvent) => isDraggedItem(event.active.data.current) && setDraggedItem(event.active.data.current),
    onDragEnd: () => setDraggedItem(undefined)
  })

  const zoomToElements = useZoomToElements()
  const focusRefs = useRef<Set<HTMLElement>>(new Set())
  const tutorialStep = useTutorialStep()

  const tutorialFocus = useMemo(() => {
    focusRefs.current = new Set()
    return rules?.game && tutorialStep?.type === TutorialStepType.Popup ? tutorialStep.focus?.(rules?.game) : undefined
  }, [tutorialStep])

  const addFocusRef = useCallback((ref: HTMLElement | null) => {
    if (!ref || focusRefs.current.has(ref)) return
    focusRefs.current.add(ref)
    if (countTutorialFocusRefs(tutorialFocus) === focusRefs.current.size) {
      const elements = Array.from(focusRefs.current)
      setTimeout(() => zoomToElements(elements))
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
          const focus = isStaticItemFocus(type, item, tutorialFocus)
          return <MaterialComponent key={`${stringType}_${index}`} type={type} itemId={item.id}
                                    playDown={tutorialStep?.type === TutorialStepType.Popup && !focus}
                                    ref={focus ? addFocusRef : undefined}
                                    css={[pointerCursorCss, transformCss(...locator.transformItem(item, context))]}
                                    onShortClick={() => play(displayMaterialRules(type, index, item), { local: true })}>
            {innerLocations.map(location =>
              <SimpleDropArea key={JSON.stringify(location)} location={location}
                              ref={isLocationFocus(location, tutorialFocus) ? addFocusRef : undefined}
                              css={[
                                childLocationCss(locators[location.type].getPositionOnParent(location, commonContext)),
                                locators[location.type].getLocationCss(location, { ...commonContext, parentItemId: item.id })
                              ]}/>
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
          const focus = isItemFocus(type, index, tutorialFocus)
          return <DraggableMaterial key={`${type}_${index}_${displayIndex}`}
                                    type={type} item={item} index={index} displayIndex={displayIndex}
                                    disabled={!itemMoves.length}
                                    playDown={tutorialStep?.type === TutorialStepType.Popup && !focus}
                                    ref={focus ? addFocusRef : undefined}
                                    postTransform={locator.transformItem(item, context).join(' ')}
                                    css={draggingToSameLocation && noPointerEvents}
                                    onShortClick={() => play(displayMaterialRules(type, index, item), { local: true })}
                                    onLongClick={itemMoves.length === 1 ?
                                      () => play(itemMoves[0], { delayed: rules.isUnpredictableMove(itemMoves[0], player) })
                                      : undefined}>
            {innerLocations.map(location =>
              <SimpleDropArea key={JSON.stringify(location)} location={location}
                              ref={isLocationFocus(location, tutorialFocus) ? addFocusRef : undefined}
                              css={[
                                childLocationCss(locators[location.type].getPositionOnParent(location, commonContext)),
                                locators[location.type].getLocationCss(location, { ...commonContext, parentItemId: item.id })
                              ]}/>
            )}
          </DraggableMaterial>
        })
      })
    })}
    {Object.values(locators).map(locator =>
      locator.getLocations(commonContext).map(location =>
        <SimpleDropArea key={JSON.stringify(location)} location={location}
                        ref={isLocationFocus(location, tutorialFocus) ? addFocusRef : undefined}
                        css={locators[location.type].getLocationCss(location, commonContext)}/>
      )
    )}
    <MaterialRulesDialog open={!!game?.rulesDisplay} close={() => play(closeRulesDisplay, { local: true })}/>
    {game?.tutorialStep !== undefined && <MaterialTutorialDisplay/>}
  </>
}

const noPointerEvents = css`
  pointer-events: none;
`

const childLocationCss = ({ x, y }: XYCoordinates) => css`
  position: absolute;
  left: ${x}%;
  top: ${y}%;
  transform: translate(-50%, -50%);
`