/** @jsxImportSource @emotion/react */
import { isCompetitive, isCompetitiveScore, rankPlayers, Rules } from '@gamepark/rules-api'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { usePlayerId, usePlayerIds, usePlayerName, useRules } from './index'

export const useResultText = <PlayerId = any>(): string => {
  const { t } = useTranslation()
  const rules = useRules<Rules>()
  const player = usePlayerId<PlayerId>()
  const players = usePlayerIds<PlayerId>()

  const winners = useMemo(() => {
    if (!rules || !isCompetitive(rules)) return []
    let winners: PlayerId[] = [players[0]]
    for (let i = 1; i < players.length; i++) {
      const rank = rankPlayers(rules, winners[0], players[i])
      if (rank === 0) winners.push(players[i])
      else if (rank > 0) winners = [players[i]]
    }
    return winners
  }, [rules, players])

  const winnerName = usePlayerName(winners[0])

  if (rules && isCompetitive(rules)) {
    if (isCompetitiveScore(rules)) {
      const score = rules.getScore(winners[0])
      if (score !== undefined) {
        if (winners.length === 1) {
          if (winners[0] === player) {
            return t('result.score.victory', { score })
          } else {
            return t('result.score.winner', { player: winnerName, score })
          }
        } else if (winners.length === players.length) {
          return t('result.score.tie.all', { score })
        } else if (player !== undefined && winners.includes(player)) {
          return t('result.score.tie.you', { score, tied: winners.length - 1 })
        } else {
          return t('result.score.tie.other', { score, tied: winners.length })
        }
      }
    }
    if (winners.length === 1) {
      if (winners[0] === player) {
        return t('result.comp.victory')
      } else {
        return t('result.comp.winner', { player: winnerName })
      }
    } else if (winners.length === players.length) {
      return t('result.comp.tie.all')
    } else if (player !== undefined && winners.includes(player)) {
      return t('result.comp.tie.you', { tied: winners.length - 1 })
    } else {
      return t('result.comp.tie.other', { tied: winners.length })
    }
  }

  return t('result.default')
}
