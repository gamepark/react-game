/** @jsxImportSource @emotion/react */
import { ItemContext } from '../../../locators'
import { useCallback, useMemo, useRef } from 'react'
import { useMaterialContext, usePlay, useRules, useZoomToElements } from '../../../hooks'
import { closeRulesDisplay, displayMaterialRules, Location, MaterialRules } from '@gamepark/rules-api'
import { MaterialComponent } from '../MaterialComponent'
import { pointerCursorCss, transformCss } from '../../../css'
import { DraggableMaterial } from '../DraggableMaterial'
import { MaterialRulesDialog } from '../../dialogs'
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
  const rules = useRules<MaterialRules>()
  const play = usePlay()

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
        const description = material[type]
        const focus = isItemFocus(type, index, tutorialFocus)
        return [...Array(item.quantity ?? 1)].map((_, displayIndex) => {
          const itemContext: ItemContext = { ...context, type, index, displayIndex }
          if (locator.hide(item, itemContext)) return null
          const innerLocations = description.getLocations(item, itemContext)
          const locationsFocus = tutorialPopup ? getLocationsFocus(tutorialFocus).filter(location => innerLocations.some(innerLocation => equal(innerLocation, location))) : []
          return <DraggableMaterial key={`${type}_${index}_${displayIndex}`}
                                    type={type} index={index} displayIndex={displayIndex}
                                    playDown={tutorialPopup && !focus && !locationsFocus.length}
                                    ref={focus ? addFocusRef : undefined}
                                    postTransform={locator.transformItem(item, itemContext).join(' ')}
                                    onShortClick={() => play(displayMaterialRules(type, item, index), { local: true })}>
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

const getLocationsFocus = (focus?: TutorialFocus | TutorialFocus[]): Location[] => {
  if (!focus) return []
  if (Array.isArray(focus)) {
    return focus.filter(isLocationBuilder).map(builder => builder.location)
  }
  return isLocationBuilder(focus) ? [focus.location] : []
}

