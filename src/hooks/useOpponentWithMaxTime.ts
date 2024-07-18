import { GamePageState, Player } from '@gamepark/react-client'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

/**
 * Returns true if I wait an opponent with negative time
 */
export const useOpponentWithMaxTime = (time?: number) => {
  const options = useSelector((state: GamePageState) => state.options)
  const playerId = useSelector((state: GamePageState) => state.playerId)
  const players = useSelector((state: GamePageState) => state.players)
  const clientTimeDelta = useSelector((state: GamePageState) => state.clientTimeDelta)
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