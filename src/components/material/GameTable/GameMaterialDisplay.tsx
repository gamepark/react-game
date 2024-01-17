/** @jsxImportSource @emotion/react */
import { closeHelpDisplay, displayMaterialHelp, MaterialRules } from '@gamepark/rules-api'
import { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useControls } from 'react-zoom-pan-pinch'
import { pointerCursorCss, transformCss } from '../../../css'
import { useMaterialContext, usePlay, useRules, useZoomToElements } from '../../../hooks'
import { useTutorialStep } from '../../../hooks/useTutorialStep'
import { centerLocator, ItemContext } from '../../../locators'
import { MaterialRulesDialog } from '../../dialogs'
import { MaterialTutorialDisplay } from '../../tutorial/MaterialTutorialDisplay'
import { DraggableMaterial } from '../DraggableMaterial'
import { LocationsMask, SimpleDropArea } from '../locations'
import { MaterialComponent } from '../MaterialComponent'
import { countTutorialFocusRefs, isItemFocus, isLocationFocus, isStaticItemFocus } from './FocusableElement'
import { getInnerLocations } from './FocusableLocation'

export const GameMaterialDisplay = () => {
  const context = useMaterialContext()
  const material = context.material
  const locators = context.locators
  const rules = useRules<MaterialRules>()
  const play = usePlay()
  const { t } = useTranslation()

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

  if (!rules) return <></>
  const game = rules?.game

  return <>
    {Object.entries(material).map(([stringType, description]) => {
      const type = parseInt(stringType)
      return description?.getStaticItems(context).map((item, index) => {
        const locator = locators[item.location.type] ?? centerLocator
        return [...Array(item.quantity ?? 1)].map((_, displayIndex) => {
          const itemContext: ItemContext = { ...context, type, index, displayIndex }
          const innerLocations = getInnerLocations(item, itemContext, tutorialFocus)
          const focus = isStaticItemFocus(type, item, tutorialFocus)
          return <MaterialComponent key={`${type}_${index}_${displayIndex}`} type={type} itemId={item.id}
                                    playDown={tutorialFocus && !focus && !innerLocations.some(location => location.focus)}
                                    ref={focus ? addFocusRef : undefined}
                                    css={[pointerCursorCss, transformCss(...locator.transformItem(item, itemContext))]}
                                    onShortClick={() => play(displayMaterialHelp(type, item, index, displayIndex), { local: true })}>
            <LocationsMask locations={innerLocations.filter(l => l.focus).map(l => l.location)}/>
            {innerLocations.map(({ focus, location }) =>
              <SimpleDropArea key={JSON.stringify(location)} location={location} alwaysVisible={focus}
                              ref={focus ? addFocusRef : undefined}/>)}
          </MaterialComponent>
        })
      })
    })}
    {rules && game && Object.entries(game.items).map(([stringType, items]) => {
      if (!items) return null
      const type = parseInt(stringType)
      return items.map((item, index) => {
        const locator = locators[item.location.type]
        return [...Array(item.quantity ?? 1)].map((_, displayIndex) => {
          const itemContext: ItemContext = { ...context, type, index, displayIndex }
          if (locator?.hide(item, itemContext)) return null
          const innerLocations = getInnerLocations(item, itemContext, tutorialFocus)
          const focus = isItemFocus(type, index, tutorialFocus)
          return <DraggableMaterial key={`${type}_${index}_${displayIndex}`}
                                    type={type} index={index} displayIndex={displayIndex}
                                    playDown={tutorialFocus && !focus && !innerLocations.some(location => location.focus)}
                                    ref={focus ? addFocusRef : undefined}
                                    title={item.quantity !== undefined ? t('quantity.tooltip', { n: item.quantity })! : undefined}>
            <LocationsMask locations={innerLocations.filter(l => l.focus).map(l => l.location)}/>
            {innerLocations.map(({ focus, location }) =>
              <SimpleDropArea key={JSON.stringify(location)} location={location} alwaysVisible={focus} ref={focus ? addFocusRef : undefined}/>)}
          </DraggableMaterial>
        })
      })
    })}
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
