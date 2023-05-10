import { GamePageState } from '@gamepark/react-client'
import { GameSpeed } from '@gamepark/rules-api'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

export const usePlayerTime = <PlayerId>(playerId: PlayerId) => {
  const [result, setResult] = useState<number>()
  const { options, player, clientTimeDelta } = useSelector((state: GamePageState) => ({
    options: state.options,
    player: state.players.find(p => p.id === playerId),
    clientTimeDelta: state.clientTimeDelta
  }))
  const running = options && options.speed === GameSpeed.RealTime && player?.time?.playing

  useEffect(() => {
    if (running) {
      const intervalID = setInterval(() => setResult(result => result ? result - 1000 : result), 1000)
      return () => clearInterval(intervalID)
    }
    return
  }, [running])

  useEffect(() => {
    if (options?.speed !== GameSpeed.RealTime || !player?.time) {
      setResult(undefined)
    } else if (player.time.playing) {
      setResult(player.time.availableTime + Date.parse(player.time.lastChange) - new Date().getTime() - clientTimeDelta)
    } else {
      setResult(player.time.availableTime)
    }
  }, [options?.speed, player?.time?.playing, player?.time?.lastChange, player?.time?.availableTime, clientTimeDelta])

  return result
}