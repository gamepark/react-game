import { store } from '@gamepark/react-client'
import { MaterialRules } from '@gamepark/rules-api'
import { useEffect, useRef } from 'react'
import { usePlayerId, useRules } from '../../../hooks'
import { AudioLoader } from './AudioLoader'
import { bellSoundDataUri } from './bellSound'

export { bellSoundDataUri }

const FOCUS_THRESHOLD = 3000

export const useYourTurnSound = (audioLoader: AudioLoader) => {
  const rules = useRules<MaterialRules>()
  const playerId = usePlayerId()
  const wasActiveRef = useRef<boolean | undefined>(undefined)
  const lastFocusTimeRef = useRef(Date.now())

  useEffect(() => {
    audioLoader.load([bellSoundDataUri])
  }, [audioLoader])

  useEffect(() => {
    const onFocus = () => { lastFocusTimeRef.current = Date.now() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  useEffect(() => {
    if (!rules || playerId === undefined) {
      wasActiveRef.current = undefined
      return
    }
    const isActive = rules.isTurnToPlay(playerId)
    const hadFocusRecently = document.hasFocus() || Date.now() - lastFocusTimeRef.current < FOCUS_THRESHOLD

    if (isActive && !hadFocusRecently && wasActiveRef.current !== undefined) {
      const { soundsMuted } = store.getState()
      if (!soundsMuted) {
        audioLoader.play(bellSoundDataUri)
      }
    }
    wasActiveRef.current = isActive
  }, [rules, playerId, audioLoader])
}
