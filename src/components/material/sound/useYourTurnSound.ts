import { store } from '@gamepark/react-client'
import { MaterialRules } from '@gamepark/rules-api'
import { useEffect, useRef, useState } from 'react'
import { usePlayerId, useRules } from '../../../hooks'
import { AudioLoader } from './AudioLoader'
import { bellSoundDataUri } from './bellSound'

export { bellSoundDataUri }

const FOCUS_THRESHOLD = 3000

export const useYourTurnSound = (audioLoader: AudioLoader) => {
  const rules = useRules<MaterialRules>()
  const playerId = usePlayerId()
  const [isActive, setIsActive] = useState(false)
  const lastFocusTimeRef = useRef(Date.now())
  const initializedRef = useRef(false)

  useEffect(() => {
    audioLoader.load([bellSoundDataUri])
  }, [audioLoader])

  useEffect(() => {
    const onFocus = () => { lastFocusTimeRef.current = Date.now() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  // Track isActive from rules — only mark inactive if player had focus recently
  useEffect(() => {
    if (!rules || playerId === undefined) return
    const active = rules.isTurnToPlay(playerId)
    if (active) {
      setIsActive(true)
    } else {
      const hadFocusRecently = document.hasFocus() || Date.now() - lastFocusTimeRef.current < FOCUS_THRESHOLD
      if (hadFocusRecently) {
        setIsActive(false)
      }
    }
  }, [rules, playerId])

  // Play bell when isActive changes to true
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      return
    }
    if (!isActive) return
    if (document.hasFocus()) return
    const { soundsMuted } = store.getState()
    if (soundsMuted) return
    audioLoader.play(bellSoundDataUri)
  }, [isActive, audioLoader])
}
