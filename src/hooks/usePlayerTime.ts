import { GamePageState } from '@gamepark/react-client'
import { GameSpeed } from '@gamepark/rules-api'
import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { usePlayer } from './usePlayers'

const isLocalDev = process.env.NODE_ENV !== 'production' && !new URLSearchParams(window.location.search).get('game')

export const usePlayerTime = <PlayerId>(playerId: PlayerId) => {
  const [result, setResult] = useState<number>()
  const options = useSelector((state: GamePageState) => state.options)
  const player = usePlayer(playerId)
  const clientTimeDelta = useSelector((state: GamePageState) => state.clientTimeDelta)
  const running = options && options.speed === GameSpeed.RealTime && player?.time?.playing

  const getPlayerTime = useCallback(() => {
    if (options?.speed !== GameSpeed.RealTime || !player?.time || player.quit) return undefined
    if (!player.time.playing) return player.time.availableTime
    return player.time.availableTime + Date.parse(player.time.lastChange) - new Date().getTime() - clientTimeDelta
  }, [options?.speed, player?.time, player?.quit, clientTimeDelta])

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