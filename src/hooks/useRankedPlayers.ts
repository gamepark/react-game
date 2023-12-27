import { isCompetitive, rankPlayers } from '@gamepark/rules-api'
import { shallowEqual, useSelector } from 'react-redux'
import { GamePageState } from '../../../workshop/packages/react-client'
import { usePlayerIds } from './usePlayerId'
import { useRules } from './useRules'

export const useRankedPlayers = <PlayerId = any>(): { id: PlayerId, rank: number, quit: boolean }[] => {
  const rules = useRules()
  const playerIds = usePlayerIds()
  const ejectedPlayers = useSelector((state: GamePageState<any, any, PlayerId>) =>
    state.players.filter(p => p.quit).map(p => p.id), shallowEqual)
  const rankedPlayers = playerIds.map(id => ({ id, rank: 1, quit: ejectedPlayers.includes(id) }))
  if (rules && isCompetitive(rules)) {
    rankedPlayers.sort((playerA, playerB) => {
      if (playerA.quit || playerB.quit) {
        return playerA.quit ? playerB.quit ? 0 : 1 : -1
      }
      return rankPlayers(rules, playerA.id, playerB.id)
    })
    for (let i = 1; i < rankedPlayers.length; i++) {
      if (rankedPlayers[i - 1].quit) {
        rankedPlayers[i].rank = rankedPlayers[i - 1].rank
      } else if (rankedPlayers[i].quit) {
        rankedPlayers[i].rank = rankedPlayers[i - 1].rank + 1
      } else {
        const rank = rankPlayers(rules, rankedPlayers[i - 1].id, rankedPlayers[i].id)
        rankedPlayers[i].rank = rank === 0 ? rankedPlayers[i - 1].rank : rankedPlayers[i - 1].rank + 1
      }
    }
  }
  return rankedPlayers
}
