import { GameMode, useGameSelector } from '@gamepark/react-client'
import { MaterialGame } from '@gamepark/rules-api'
import { useContext, useEffect, useRef } from 'react'
import { notifyTutorialStage } from '../../utilities/platform.util'
import { isMaterialTutorial } from '../tutorial'
import { gameContext } from './GameContext'

/**
 * Tells the platform page framing the tutorial when it is finished, then its game, so that the platform records the
 * player's progress. The tutorial is finished once its explanations are over, its last step behind; a tutorial without
 * steps (not a MaterialTutorial), or a game ending before its last step, is finished with its game. Each stage is told again whenever the
 * tutorial is opened past it: the platform only counts it once, and only congratulates the player on a live stage, reached
 * in front of them. Mounted for local games only.
 */
export const TutorialProgressReporter = () => {
  const tutorial = useContext(gameContext).tutorial
  const loaded = useGameSelector((state) => state.state !== undefined && state.gameMode !== undefined)
  const isTutorial = useGameSelector((state) => state.gameMode === GameMode.TUTORIAL)
  const gameOver = useGameSelector((state) => !!state.gameOver)
  const step = useGameSelector((state) => (state.state as MaterialGame | undefined)?.tutorial?.step)
  const explanationsOver = isTutorial && (gameOver || (isMaterialTutorial(tutorial) && step !== undefined && step >= tutorial.steps.length))
  const finishedAtLoad = useValueAtLoad(loaded, explanationsOver)
  const gameOverAtLoad = useValueAtLoad(loaded, isTutorial && gameOver)
  useEffect(() => {
    if (explanationsOver) notifyTutorialStage('finished', !finishedAtLoad, gameOver)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explanationsOver])
  useEffect(() => {
    if (isTutorial && gameOver) notifyTutorialStage('game-finished', !gameOverAtLoad, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTutorial, gameOver])
  return null
}

/** A value as it was once the game was loaded: a stage already behind then was not reached in front of the player. */
function useValueAtLoad(loaded: boolean, value: boolean) {
  const atLoad = useRef<boolean>(undefined)
  if (loaded && atLoad.current === undefined) atLoad.current = value
  return atLoad.current ?? false
}
