/** @jsxImportSource @emotion/react */
import { closeHelpDisplay, MaterialRules } from '@gamepark/rules-api'
import { useCallback, useMemo, useRef } from 'react'
import { useControls } from 'react-zoom-pan-pinch'
import { useMaterialContext, usePlay, useRules, useZoomToElements } from '../../../hooks'
import { useTutorialStep } from '../../../hooks/useTutorialStep'
import { MaterialRulesDialog } from '../../dialogs'
import { MaterialTutorialDisplay } from '../../tutorial/MaterialTutorialDisplay'
import { SimpleDropArea } from '../locations'
import { DynamicItemsDisplay } from './DynamicItemsDisplay'
import { countTutorialFocusRefs, isLocationFocus } from './FocusableElement'
import { StaticItemsDisplay } from './StaticItemsDisplay'

export const GameMaterialDisplay = () => {
  const context = useMaterialContext()
  const locators = context.locators
  const rules = useRules<MaterialRules>()
  const play = usePlay()

  const zoomToElements = useZoomToElements()
  const { resetTransform } = useControls()
  const focusRefs = useRef<Set<HTMLElement>>(new Set())
  const tutorialStep = useTutorialStep()
  const showTutorialPopup = rules?.game !== undefined && !rules?.game.tutorialPopupClosed && tutorialStep?.popup !== undefined

  const tutorialFocus = useMemo(() => {
    focusRefs.current = new Set()
    const tutorialFocus = showTutorialPopup ? tutorialStep?.focus?.(rules.game) ?? [] : undefined
    if (!tutorialFocus || (Array.isArray(tutorialFocus) && !tutorialFocus.length)) {
      resetTransform(1000)
    }
    return tutorialFocus
  }, [tutorialStep, showTutorialPopup, rules?.game])

  const addFocusRef = useCallback((ref: HTMLElement | null) => {
    if (!ref || focusRefs.current.has(ref)) return
    focusRefs.current.add(ref)
    if (countTutorialFocusRefs(tutorialFocus) === focusRefs.current.size) {
      const elements = Array.from(focusRefs.current)
      setTimeout(() => zoomToElements(elements, undefined, 1000), 50)
    }
  }, [tutorialFocus])

  if (!rules || !rules.game) return <></>
  const game = rules.game

  return <>
    <StaticItemsDisplay tutorialFocus={tutorialFocus} addFocusRef={addFocusRef}/>
    <DynamicItemsDisplay tutorialFocus={tutorialFocus} addFocusRef={addFocusRef}/>
    {Object.values(locators).map(locator => {
        return locator?.getLocationDescription(context)?.getLocations(context).map(location => {
          const isFocus = isLocationFocus(location, tutorialFocus)
          return <SimpleDropArea key={JSON.stringify(location)} location={location} alwaysVisible={isFocus} ref={isFocus ? addFocusRef : undefined}/>
        })
      }
    )}
    <MaterialRulesDialog open={!!game?.helpDisplay} close={() => play(closeHelpDisplay, { local: true })}/>
    {game?.tutorialStep !== undefined && <MaterialTutorialDisplay/>}
  </>
}
