import { DisplayedAction, store } from '@gamepark/react-client'
import { MaterialRules, Rules } from '@gamepark/rules-api'
import { useContext, useEffect, useRef } from 'react'
import { usePlayerId, useRules } from '../../../hooks'
import { gameContext } from '../../GameProvider'
import { AudioLoader } from './AudioLoader'
import { bellSoundDataUri } from './bellSound'

function replayAllActions(setup: any, actions: DisplayedAction[], client: any, RulesCreator: any): Rules {
  const rules = new RulesCreator(JSON.parse(JSON.stringify(setup)), client)
  for (const action of actions) {
    if (action.delayed || action.cancelled) continue
    const context = { local: action.local, transient: action.transient, player: action.playerId }
    rules.play(JSON.parse(JSON.stringify(action.move)), context)
    action.consequences.forEach((move: any) => rules.play(JSON.parse(JSON.stringify(move)), context))
  }
  return rules as Rules
}

export const useYourTurnSound = (audioLoader: AudioLoader) => {
  const { Rules } = useContext(gameContext)
  const rules = useRules<MaterialRules>()
  const playerId = usePlayerId()
  const lastActionCountRef = useRef(0)
  const bellPlayedForActionCountRef = useRef(0)
  const wasActiveRef = useRef<boolean | undefined>(undefined)

  useEffect(() => {
    audioLoader.load([bellSoundDataUri])
  }, [audioLoader])

  // Case 2: visible but not focused — play bell after animations catch up
  useEffect(() => {
    if (!rules || playerId === undefined) {
      wasActiveRef.current = undefined
      return
    }
    const isActive = rules.isTurnToPlay(playerId)
    if (isActive && wasActiveRef.current === false && !document.hasFocus()) {
      const { soundsMuted } = store.getState()
      if (!soundsMuted) {
        audioLoader.play(bellSoundDataUri)
      }
    }
    wasActiveRef.current = isActive
  }, [rules, playerId, audioLoader])

  // Case 1: hidden — play bell immediately via replayAllActions
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      if (document.visibilityState !== 'hidden') return
      const { setup, actions, soundsMuted, client, playerId } = store.getState()
      if (!setup || !actions || !playerId || soundsMuted) return

      // Don't play on initial page load
      if (wasActiveRef.current === undefined) return

      const actionCount = actions.filter(a => !a.delayed && !a.cancelled).length
      if (actionCount <= lastActionCountRef.current) {
        lastActionCountRef.current = actionCount
        return
      }

      lastActionCountRef.current = actionCount
      if (actionCount <= bellPlayedForActionCountRef.current) return

      try {
        const rules = replayAllActions(setup, actions, client, Rules)
        const isActive = rules.isTurnToPlay(playerId)
        if (isActive) {
          audioLoader.play(bellSoundDataUri)
          bellPlayedForActionCountRef.current = actionCount
          wasActiveRef.current = true
        }
      } catch {
        // Game not ready
      }
    })
    return unsubscribe
  }, [Rules, audioLoader])
}
