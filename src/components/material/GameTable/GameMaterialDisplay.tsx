/** @jsxImportSource @emotion/react */
import { closeHelpDisplay, MaterialRules } from '@gamepark/rules-api'
import { usePlay, useRules } from '../../../hooks'
import { MaterialRulesDialog } from '../../dialogs'
import { MaterialTutorialDisplay } from '../../tutorial/MaterialTutorialDisplay'
import { DynamicItemsDisplay } from './DynamicItemsDisplay'
import { FocusProvider } from './focus'
import { StaticItemsDisplay } from './StaticItemsDisplay'
import { StaticLocationsDisplay } from './StaticLocationsDisplay'

export const GameMaterialDisplay = () => {
  const rules = useRules<MaterialRules>()
  const play = usePlay()

  if (!rules || !rules.game) return <></>
  const game = rules.game

  return <FocusProvider>
    <StaticItemsDisplay/>
    <DynamicItemsDisplay/>
    <StaticLocationsDisplay/>
    <MaterialRulesDialog open={!!game?.helpDisplay} close={() => play(closeHelpDisplay, { local: true })}/>
    {game?.tutorialStep !== undefined && <MaterialTutorialDisplay/>}
  </FocusProvider>
}
