import { gameContext, isMaterialTutorial, TutorialStep } from '../components'
import { useContext } from 'react'
import { useGame } from './useGame'
import { MaterialGame } from '../../../workshop/packages/rules-api'

export function useTutorialStep<P extends number = number, M extends number = number, L extends number = number>(): TutorialStep<P, M, L> | undefined {
  const game = useGame<MaterialGame>()
  const tutorial = useContext(gameContext).tutorial
  if (!game || game.tutorialStep === undefined || !isMaterialTutorial<P, M, L>(tutorial)) return
  return tutorial.steps[game.tutorialStep]
}
