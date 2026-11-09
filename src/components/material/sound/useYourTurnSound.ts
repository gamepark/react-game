import { GameMode, store, useGameSelector } from '@gamepark/react-client'
import { MaterialRules } from '@gamepark/rules-api'
import { useEffect, useRef } from 'react'
import { usePlayerId, useRules } from '../../../hooks'
import { AudioLoader } from './AudioLoader'
import { MaterialSoundConfig } from './MaterialSoundConfig'

const bellSoundUrl = 'https://sounds.game-park.com/bell.mp3'

/**
 * Ring the bell on the rising edge of the player's turn, and only there.
 *
 * The first value known is a reference, not an edge: a player loading a game where it is already their turn must
 * not hear the bell. That value is undefined until both the rules and the player are known, so the reference is
 * taken from the first real answer rather than from a default that would make the next render look like a change.
 */
export const useYourTurnSound = (audioLoader: AudioLoader) => {
  const rules = useRules<MaterialRules>()
  const playerId = usePlayerId()
  const isTutorial = useGameSelector((state) => state.gameMode === GameMode.TUTORIAL)
  const isActive = rules && playerId !== undefined ? rules.isTurnToPlay(playerId) : undefined
  const wasActive = useRef<boolean | undefined>(undefined)

  useEffect(() => {
    audioLoader.load([bellSoundUrl])
  }, [audioLoader])

  useEffect(() => {
    if (isActive === undefined) return
    const risingEdge = isActive && wasActive.current === false
    wasActive.current = isActive
    if (!risingEdge || isTutorial) return
    if (store.getState().soundsMuted) return
    // A suspended context (no user gesture yet) does not drop a started sound, it holds it until it resumes — on
    // the first click, opening a popup for instance. A bell heard then announces nothing, so it is not played.
    if (audioLoader.status() !== 'running') return
    const config = new MaterialSoundConfig(bellSoundUrl)
    if (document.hasFocus()) config.volume = 0.15
    audioLoader.play(config)
  }, [isActive, isTutorial, audioLoader])
}
