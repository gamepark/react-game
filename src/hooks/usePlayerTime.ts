import { useGameSelector } from '@gamepark/react-client'
import { useCallback, useEffect, useState } from 'react'
import { usePlayer } from './usePlayers'

const isLocalDev = process.env.NODE_ENV !== 'production' && !new URLSearchParams(window.location.search).get('game')

export const usePlayerTime = <PlayerId>(playerId: PlayerId) => {
  const [result, setResult] = useState<number>()
  const player = usePlayer(playerId)
  const clientTimeDelta = useGameSelector((state) => state.clientTimeDelta)
  const running = player?.time?.playing

  const getPlayerTime = useCallback(() => {
    if (!player?.time || player.quit || player.time.availableTime === null || player.time.availableTime === undefined) return undefined
    if (!player.time.playing) return player.time.availableTime
    return player.time.availableTime + Date.parse(player.time.lastChange) - new Date().getTime() - clientTimeDelta
  }, [player?.time, player?.quit, clientTimeDelta])

  useEffect(() => {
    if (running) {
      const intervalID = setInterval(() => setResult(getPlayerTime()), 1000)
      return () => clearInterval(intervalID)
    }
  }, [running, getPlayerTime])

  useEffect(() => {
    setResult(getPlayerTime())
  }, [getPlayerTime])

  if (isLocalDev && result === undefined) return 30000

  return result
}