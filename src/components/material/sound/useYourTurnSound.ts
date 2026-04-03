import { store } from '@gamepark/react-client'
import { MaterialRules } from '@gamepark/rules-api'
import { useEffect, useRef } from 'react'
import { usePlayerId, useRules } from '../../../hooks'
import { AudioLoader } from './AudioLoader'
import { bellSoundDataUri } from './bellSound'

export { bellSoundDataUri }

export const useYourTurnSound = (audioLoader: AudioLoader) => {
  const rules = useRules<MaterialRules>()
  const playerId = usePlayerId()
  const wasActiveRef = useRef<boolean | undefined>(undefined)

  useEffect(() => {
    audioLoader.load([bellSoundDataUri])
  }, [audioLoader])

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
}
