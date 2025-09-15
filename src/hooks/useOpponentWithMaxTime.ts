import { Player, useGameSelector } from '@gamepark/react-client'
import { useEffect, useState } from 'react'

/**
 * Returns true if I wait an opponent with negative time
 */
export const useOpponentWithMaxTime = (time?: number) => {
  const options = useGameSelector((state) => state.options)
  const playerId = useGameSelector((state) => state.playerId)
  const players = useGameSelector((state) => state.players)
  const clientTimeDelta = useGameSelector((state) => state.clientTimeDelta)
  const player = players.find(p => p.id === playerId)
  const awaitedPlayers = players.filter(p => p.time?.playing && p.time?.availableTime !== null).sort((a, b) => getPlayerTimeout(a) - getPlayerTimeout(b))
  const opponent = awaitedPlayers.find(p => p.id !== playerId)
  const [result, setResult] = useState<Player | undefined>(opponent)
  useEffect(() => {
    if (!options || player?.time?.playing || !opponent) {
      setResult(undefined)
    } else {
      const remainingTime = getPlayerTimeout(opponent) - new Date().getTime() - clientTimeDelta + (time ?? options.maxExceedTime)
      if (remainingTime > 0) {
        setResult(undefined)
        const timeout = setTimeout(() => setResult(opponent), remainingTime)
        return () => clearTimeout(timeout)
      } else {
        setResult(opponent)
      }
    }
    return
  }, [options, player, opponent, clientTimeDelta])
  return result
}

function getPlayerTimeout(player: Player) {
  if (!player.time || !player.time.playing) return Infinity
  return Date.parse(player.time.lastChange) + (player.time.availableTime ?? Infinity)
}