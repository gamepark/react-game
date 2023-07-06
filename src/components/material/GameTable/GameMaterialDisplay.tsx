/** @jsxImportSource @emotion/react */
import { ItemContext } from '../../../locators'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useLegalMoves, useMaterialContext, usePlay, usePlayerId, useRules, useZoomToElements } from '../../../hooks'
import { closeRulesDisplay, DisplayedItem, displayMaterialRules, Location, MaterialMove, MaterialRules } from '@gamepark/rules-api'
import { MaterialComponent } from '../MaterialComponent'
import { pointerCursorCss, transformCss } from '../../../css'
import { DraggableMaterial, isDraggedItem } from '../DraggableMaterial'
import { MaterialRulesDialog } from '../../dialogs'
import { DragStartEvent, useDndMonitor } from '@dnd-kit/core'
import { css } from '@emotion/react'
import { MaterialTutorialDisplay } from '../../tutorial/MaterialTutorialDisplay'
import { useTutorialStep } from '../../../hooks/useTutorialStep'
import { countTutorialFocusRefs, isItemFocus, isLocationBuilder, isLocationFocus, isStaticItemFocus, TutorialFocus, TutorialStepType } from '../../tutorial'
import { LocationsMask, SimpleDropArea } from '../locations'
import equal from 'fast-deep-equal'

export const GameMaterialDisplay = () => {
  const context = useMaterialContext()
  const material = context.material
  const locators = context.locators
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

  return <>
    {Object.entries(material).map(([stringType, description]) => {
      const type = parseInt(stringType)
      return description.getItems(game, player).map((item, index) => {
        const locator = locators[item.location.type]
        return [...Array(item.quantity ?? 1)].map((_, displayIndex) => {
          const itemContext: ItemContext = { ...context, type, index, displayIndex }
          const innerLocations = description.getLocations(item, itemContext)
          const focus = isStaticItemFocus(type, item, tutorialFocus)
          const locationsFocus = getLocationsFocus(tutorialFocus).filter(location => innerLocations.some(innerLocation => equal(innerLocation, location)))
          return <MaterialComponent key={`${type}_${index}_${displayIndex}`} type={type} itemId={item.id}
                                    playDown={tutorialStep?.type === TutorialStepType.Popup && !focus && !locationsFocus.length}
                                    ref={focus ? addFocusRef : undefined}
                                    css={[pointerCursorCss, transformCss(...locator.transformItem(item, itemContext))]}
                                    onShortClick={() => play(displayMaterialRules(type, index, item), { local: true })}>
            <LocationsMask locations={locationsFocus}/>
            {innerLocations.map(location =>
              <SimpleDropArea key={JSON.stringify(location)} location={location}
                              ref={isLocationFocus(location, tutorialFocus) ? addFocusRef : undefined}/>
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
        const draggingToSameLocation = !!draggedItem && legalMoves.some(move =>
          locator.isMoveItemToLocation(move, draggedItem.type, draggedItem.index, item.location, undefined, context)
        )
        return [...Array(item.quantity ?? 1)].map((_, displayIndex) => {
          const itemContext: ItemContext = { ...context, type, index, displayIndex }
          const innerLocations = description.getLocations(item, itemContext)
          if (locator.hide(item, itemContext)) return null
          const itemMoves = legalMoves.filter(move => rules.isMoveTrigger(move, move => description.isActivable(move, type, index)))
          const focus = isItemFocus(type, index, tutorialFocus)
          const locationsFocus = getLocationsFocus(tutorialFocus).filter(location => innerLocations.some(innerLocation => equal(innerLocation, location)))
          return <DraggableMaterial key={`${type}_${index}_${displayIndex}`}
                                    type={type} item={item} index={index} displayIndex={displayIndex}
                                    disabled={!itemMoves.length}
                                    playDown={tutorialStep?.type === TutorialStepType.Popup && !focus}
                                    ref={focus ? addFocusRef : undefined}
                                    postTransform={locator.transformItem(item, itemContext).join(' ')}
                                    css={draggingToSameLocation && noPointerEvents}
                                    onShortClick={() => play(displayMaterialRules(type, index, item), { local: true })}
                                    onLongClick={itemMoves.length === 1 ?
                                      () => play(itemMoves[0], { delayed: rules.isUnpredictableMove(itemMoves[0], player) })
                                      : undefined}>
            <LocationsMask locations={locationsFocus}/>
            {innerLocations.map(location =>
              <SimpleDropArea key={JSON.stringify(location)} location={location}
                              ref={isLocationFocus(location, tutorialFocus) ? addFocusRef : undefined}/>
            )}
          </DraggableMaterial>
        })
      })
    })}
    {Object.values(locators).map(locator =>
      locator.getLocations(context).map(location =>
        <SimpleDropArea key={JSON.stringify(location)} location={location}
                        ref={isLocationFocus(location, tutorialFocus) ? addFocusRef : undefined}/>
      )
    )}
    <MaterialRulesDialog open={!!game?.rulesDisplay} close={() => play(closeRulesDisplay, { local: true })}/>
    {game?.tutorialStep !== undefined && <MaterialTutorialDisplay/>}
  </>
}

const noPointerEvents = css`
  pointer-events: none;
`

const getLocationsFocus = (focus?: TutorialFocus | TutorialFocus[]): Location[] => {
  if (!focus) return []
  if (Array.isArray(focus)) {
    return focus.filter(isLocationBuilder).map(builder => builder.location)
  }
  return isLocationBuilder(focus) ? [focus.location] : []
}

