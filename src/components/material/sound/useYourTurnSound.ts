import { store } from '@gamepark/react-client'
import { MaterialRules } from '@gamepark/rules-api'
import { useEffect, useRef, useState } from 'react'
import { usePlayerId, useRules } from '../../../hooks'
import { AudioLoader } from './AudioLoader'

const dingSoundUrl = 'https://sounds.game-park.com/ding.mp3'

export const useYourTurnSound = (audioLoader: AudioLoader) => {
  const rules = useRules<MaterialRules>()
  const playerId = usePlayerId()
  const [isActive, setIsActive] = useState(false)
  const initializedRef = useRef(false)

  useEffect(() => {
    audioLoader.load([dingSoundUrl])
  }, [audioLoader])

  useEffect(() => {
    if (!rules || playerId === undefined) return
    setIsActive(rules.isTurnToPlay(playerId))
  }, [rules, playerId])

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      return
    }
    if (!isActive) return
    if (document.hasFocus()) return
    const { soundsMuted } = store.getState()
    if (soundsMuted) return
    audioLoader.play(dingSoundUrl)
  }, [isActive, audioLoader])
}
