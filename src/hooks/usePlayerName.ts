import { GamePageState } from '@gamepark/react-client'
import { useSelector } from 'react-redux'
import { useContext } from 'react'
import { gameContext } from '../components'
import { isWithPlayerIdOptions } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'

export function usePlayerName<PlayerId = any>(playerId: PlayerId): string {
  const name = useSelector((state: GamePageState) => state.players.find(player => player.id === playerId ?? state.playerId)?.name ?? '')
  const optionsSpec = useContext(gameContext).optionsSpec
  const { t } = useTranslation()
  if (name) return name
  if (isWithPlayerIdOptions(optionsSpec)) return optionsSpec.players.id.valueSpec(playerId).label(t)
  return t('Player {number}', { number: playerId })
}
