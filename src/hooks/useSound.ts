import { gameContext, GamePageState } from '@gamepark/react-client'
import { useContext, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

// Deprecated? Probably only used in It's a Wonderful World
export function useSound(src: string): HTMLAudioElement {
  const context = useContext(gameContext)
  const [audio] = useState(new Audio(src))
  audio.muted = useSelector((state: GamePageState) => state.soundsMuted)
  useEffect(() => {
    if (context) {
      context.hasSounds = true
    }
  }, [context])
  return audio
}
