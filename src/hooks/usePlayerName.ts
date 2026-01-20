import { useGameSelector, useMe } from '@gamepark/react-client'
import { isWithPlayerIdOptions } from '@gamepark/rules-api'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { gameContext } from '../components'
import { usePlayerId } from './usePlayerId'

export function usePlayerName<PlayerId = any>(playerId: PlayerId): string {
  const name = useGameSelector((state) => state.players.find(player => player.id === (playerId ?? state.playerId))?.name ?? '')
  const optionsSpec = useContext(gameContext).optionsSpec
  const me = useMe()
  const myId = usePlayerId()
  const { t } = useTranslation()
  const { t: tCommon } = useTranslation('common')
  if (name) return name
  if (myId === playerId) return me?.user?.name ?? tCommon('anonymous')
  if (isWithPlayerIdOptions(optionsSpec)) return optionsSpec.players.id.valueSpec(playerId).label(t)
  return tCommon('Player {number}', { number: playerId })
}
