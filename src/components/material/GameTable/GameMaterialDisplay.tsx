/** @jsxImportSource @emotion/react */
import { ItemContext } from '../../../locators'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useLegalMoves, useMaterialContext, usePlay, usePlayerId, useRules, useZoomToElements } from '../../../hooks'
import { closeRulesDisplay, DisplayedItem, displayMaterialRules, Location, MaterialMove, MaterialRules } from '@gamepark/rules-api'
import { MaterialComponent } from '../MaterialComponent'
import { pointerCursorCss, transformCss } from '../../../css'
import { dataIsDisplayedItem, DraggableMaterial } from '../DraggableMaterial'
import { MaterialRulesDialog } from '../../dialogs'
import { DragStartEvent, useDndMonitor } from '@dnd-kit/core'
import { css } from '@emotion/react'
import { MaterialTutorialDisplay } from '../../tutorial/MaterialTutorialDisplay'
import { useTutorialStep } from '../../../hooks/useTutorialStep'
import { countTutorialFocusRefs, isItemFocus, isLocationBuilder, isLocationFocus, isStaticItemFocus, TutorialFocus } from '../../tutorial'
import { LocationsMask, SimpleDropArea } from '../locations'
import equal from 'fast-deep-equal'
import { useControls } from 'react-zoom-pan-pinch'

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
    onDragStart: (event: DragStartEvent) => dataIsDisplayedItem(event.active.data.current) && setDraggedItem(event.active.data.current),
    onDragEnd: () => setDraggedItem(undefined)
  })

  const zoomToElements = useZoomToElements()
  const { resetTransform } = useControls()
  const focusRefs = useRef<Set<HTMLElement>>(new Set())
  const tutorialStep = useTutorialStep()
  const tutorialPopup = !rules?.game.tutorialPopupClosed && tutorialStep?.popup

  const tutorialFocus = useMemo(() => {
    focusRefs.current = new Set()
    const tutorialFocus = rules?.game ? tutorialStep?.focus?.(rules.game) : undefined
    if (!tutorialFocus) {
      resetTransform(1000)
    }
    return tutorialFocus
  }, [tutorialStep])

  const addFocusRef = useCallback((ref: HTMLElement | null) => {
    if (!ref || focusRefs.current.has(ref)) return
    focusRefs.current.add(ref)
    if (countTutorialFocusRefs(tutorialFocus) === focusRefs.current.size) {
      const elements = Array.from(focusRefs.current)
      setTimeout(() => zoomToElements(elements, undefined, 1000))
    }
  }, [tutorialFocus])

  if (!rules) return <></>
  const game = rules?.game

  return <>
    {Object.entries(material).map(([stringType, description]) => {
      const type = parseInt(stringType)
      return description.getStaticItems(context).map((item, index) => {
        const locator = locators[item.location.type]
        return [...Array(item.quantity ?? 1)].map((_, displayIndex) => {
          const itemContext: ItemContext = { ...context, type, index, displayIndex }
          const innerLocations = description.getLocations(item, itemContext)
          const focus = isStaticItemFocus(type, item, tutorialFocus)
          const locationsFocus = tutorialPopup ? getLocationsFocus(tutorialFocus).filter(location => innerLocations.some(innerLocation => equal(innerLocation, location))) : []
          return <MaterialComponent key={`${type}_${index}_${displayIndex}`} type={type} itemId={item.id}
                                    playDown={tutorialPopup && !focus && !locationsFocus.length}
                                    ref={focus ? addFocusRef : undefined}
                                    css={[pointerCursorCss, transformCss(...locator.transformItem(item, itemContext))]}
                                    onShortClick={() => play(displayMaterialRules(type, item), { local: true })}>
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
        const locationDescription = locator.locationDescription
        const description = material[type]
        const focus = isItemFocus(type, index, tutorialFocus)
        return [...Array(item.quantity ?? 1)].map((_, displayIndex) => {
          const itemContext: ItemContext = { ...context, type, index, displayIndex }
          const draggingToSameLocation = !!draggedItem && !!locationDescription && legalMoves.some(move =>
            description.canDrag(move, itemContext) && locationDescription.canDrop(move, item.location, context)
          )
          const itemMoves = legalMoves.filter(move => description.canDrag(move, itemContext))
          if (locator.hide(item, itemContext)) return null
          const innerLocations = description.getLocations(item, itemContext)
          const locationsFocus = tutorialPopup ? getLocationsFocus(tutorialFocus).filter(location => innerLocations.some(innerLocation => equal(innerLocation, location))) : []
          return <DraggableMaterial key={`${type}_${index}_${displayIndex}`}
                                    type={type} item={item} index={index} displayIndex={displayIndex}
                                    disabled={!itemMoves.length}
                                    highlight={draggedItem ? false : undefined}
                                    playDown={tutorialPopup && !focus && !itemMoves.length && !locationsFocus.length}
                                    ref={focus ? addFocusRef : undefined}
                                    postTransform={locator.transformItem(item, itemContext).join(' ')}
                                    css={draggingToSameLocation && noPointerEvents}
                                    onShortClick={() => play(displayMaterialRules(type, item, index), { local: true })}
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
      locator.locationDescription?.getLocations(context).map(location =>
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

