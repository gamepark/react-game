import { MaterialGame } from '@gamepark/rules-api'
import { useEffect, useRef } from 'react'
import { useGame } from '../../../hooks'
import { useTutorialStep } from '../../../hooks/useTutorialStep'
import { AudioLoader } from './AudioLoader'
import { openDialogSound } from './defaultSounds'

/**
 * Play a sound when a dialog carrying text to read appears: a material help, a tutorial popup.
 *
 * Both are watched from here rather than from the components that display them, because the {@link AudioLoader}
 * is built by {@link MaterialGameSounds} and never leaves it. That is also why the two states are read from
 * the game rather than from the dialogs: what is heard is the popup existing, not a component mounting.
 */
export const useDialogSound = (audioLoader: AudioLoader) => {
  const game = useGame<MaterialGame>()
  const tutorialStep = useTutorialStep()

  useEffect(() => {
    audioLoader.load([openDialogSound])
  }, [audioLoader])

  // Undefined until the game is known, so the hooks below have nothing to compare against yet.
  useHelpDialogSound(game && game.helpDisplay !== undefined, audioLoader)
  useTutorialPopupSound(game?.tutorial?.step, tutorialStep?.popup !== undefined, audioLoader)
}

/**
 * Play on the rising edge of the help dialog being open, and only there.
 *
 * The dialog stays open while the player walks through the items with the previous/next arrows, and that is
 * one consultation rather than a series of openings.
 */
const useHelpDialogSound = (isOpen: boolean | undefined, audioLoader: AudioLoader) => {
  const wasOpen = useRef<boolean | undefined>(undefined)

  useEffect(() => {
    if (isOpen === undefined) return
    if (wasOpen.current === undefined) {
      wasOpen.current = isOpen
      return
    }
    if (isOpen && !wasOpen.current) audioLoader.play(openDialogSound)
    wasOpen.current = isOpen
  }, [isOpen, audioLoader])
}

/**
 * Play on every tutorial step that brings a popup.
 *
 * The step, not the popup being open: a player moving from a step with a popup to another step with a popup
 * never sees one close, so there is no edge to catch there — and those two popups are two texts to read, not
 * one. Whether the previous popup was closed does not enter into it, since `SetTutorialStep` reopens anyway.
 *
 * A step without a popup is silent but still remembered, so the next step that has one is a change.
 */
const useTutorialPopupSound = (step: number | undefined, hasPopup: boolean, audioLoader: AudioLoader) => {
  const lastStep = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (step === undefined) return
    // The first step seen is not a step change. A player reconnecting into a tutorial receives its step in
    // the game state, and that must not sound like they just reached it.
    if (lastStep.current === undefined) {
      lastStep.current = step
      return
    }
    if (step !== lastStep.current && hasPopup) audioLoader.play(openDialogSound)
    lastStep.current = step
  }, [step, hasPopup, audioLoader])
}
