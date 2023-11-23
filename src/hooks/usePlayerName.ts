import { GamePageState, useMe } from '@gamepark/react-client'
import { isWithPlayerIdOptions } from '@gamepark/rules-api'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { gameContext } from '../components'
import { usePlayerId } from './usePlayerId'

export function usePlayerName<PlayerId = any>(playerId: PlayerId): string {
  const name = useSelector((state: GamePageState) => state.players.find(player => player.id === (playerId ?? state.playerId))?.name ?? '')
  const optionsSpec = useContext(gameContext).optionsSpec
  const me = useMe()
  const myId = usePlayerId()
  const { t } = useTranslation()
  if (name) return name
  if (myId === playerId) return me?.user?.name ?? t('You')
  if (isWithPlayerIdOptions(optionsSpec)) return optionsSpec.players.id.valueSpec(playerId).label(t)
  return t('Player {number}', { number: playerId })
}
