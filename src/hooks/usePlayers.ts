import { GamePageState, Player } from '@gamepark/react-client'
import produce from 'immer'
import { useSelector } from 'react-redux'
import { useNow } from './useNow'
import { usePlayerId } from './usePlayerId'
import { useMemo } from 'react'

type Options = {
  sortFromMe?: boolean
  withTimeUpdate?: boolean
}

export const usePlayers = <PlayerId = any>(options?: Options): Player<PlayerId>[] => {
  const now = useNow({ standby: !options?.withTimeUpdate })
  const playerId = usePlayerId<PlayerId>()
  const rawPlayers = useSelector((state: GamePageState<any, any, PlayerId>) => state.players)
  const players = useMemo(() => {
    const index = rawPlayers.findIndex(player => player.id === playerId)
    if (index < 1) return rawPlayers
    return rawPlayers.slice(index).concat(rawPlayers.slice(0, index))
  }, [playerId, rawPlayers])

  if (options?.withTimeUpdate && players.every(player => player.time)) {
    return produce(players, draft => updatePlayersTime(draft, now))
  } else {
    return players
  }
}

export const usePlayer = <PlayerId = any>(playerId?: PlayerId, { withTimeUpdate }: Options = { withTimeUpdate: false }): Player<PlayerId> | undefined => {
  const defaultPlayerId = usePlayerId()
  playerId = playerId ?? defaultPlayerId
  let players = useSelector((state: GamePageState<any, any, PlayerId>) => state.players)
  const standby = !withTimeUpdate || players.every(player => !player.time?.playing)
  const now = useNow({ standby })
  if (!standby && players.every(player => player.time)) {
    players = produce(players, draft => updatePlayersTime(draft, now))
  }
  return players.find(player => player.id === playerId)
}

const updatePlayersTime = <PlayerId>(players: Player<PlayerId>[], now: number) => {
  const activePlayers: Player<PlayerId>[] = players.filter(player => player.time!.playing)
  if (activePlayers.length) {
    const durationSinceLastChange: number = players.reduce((minDuration, player) => Math.min(now - Date.parse(player.time!.lastChange), minDuration), Infinity)
    const cumulatedDownTime = durationSinceLastChange * (players.length - activePlayers.length)
    const weightedDownTime = durationSinceLastChange * (players.length - activePlayers.length) / activePlayers.length
    players.forEach(player => {
      const durationSinceLastPlayerChange = now - Date.parse(player.time!.lastChange)
      if (player.time!.playing) {
        player.time!.availableTime -= durationSinceLastPlayerChange
        player.time!.cumulatedPlayTime += durationSinceLastPlayerChange
        player.time!.highestPlayTime = Math.max(player.time!.highestPlayTime, durationSinceLastPlayerChange)
        player.time!.cumulatedWaitForMeTime += cumulatedDownTime
        player.time!.weightedWaitForMeTime += weightedDownTime
      } else {
        player.time!.cumulatedDownTime += durationSinceLastPlayerChange
        player.time!.highestDownTime = Math.max(player.time!.highestDownTime, durationSinceLastPlayerChange)
      }
    })
  }
}