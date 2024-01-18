/** @jsxImportSource @emotion/react */
import { closeHelpDisplay, MaterialRules } from '@gamepark/rules-api'
import { useCallback, useMemo, useRef } from 'react'
import { useControls } from 'react-zoom-pan-pinch'
import { usePlay, useRules, useZoomToElements } from '../../../hooks'
import { useTutorialStep } from '../../../hooks/useTutorialStep'
import { MaterialRulesDialog } from '../../dialogs'
import { MaterialTutorialDisplay } from '../../tutorial/MaterialTutorialDisplay'
import { DynamicItemsDisplay } from './DynamicItemsDisplay'
import { countTutorialFocusRefs } from './focus'
import { StaticItemsDisplay } from './StaticItemsDisplay'
import { StaticLocationsDisplay } from './StaticLocationsDisplay'

export const GameMaterialDisplay = () => {
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
    <StaticLocationsDisplay tutorialFocus={tutorialFocus} addFocusRef={addFocusRef}/>
    <MaterialRulesDialog open={!!game?.helpDisplay} close={() => play(closeHelpDisplay, { local: true })}/>
    {game?.tutorialStep !== undefined && <MaterialTutorialDisplay/>}
  </>
}
