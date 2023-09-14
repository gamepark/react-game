import { GamePageState, useMe } from '@gamepark/react-client'
import { useSelector } from 'react-redux'
import { useContext } from 'react'
import { gameContext } from '../components'
import { isWithPlayerIdOptions } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'
import { usePlayerId } from './usePlayerId'

export function usePlayerName<PlayerId = any>(playerId: PlayerId): string {
  const name = useSelector((state: GamePageState) => state.players.find(player => player.id === playerId ?? state.playerId)?.name ?? '')
  const optionsSpec = useContext(gameContext).optionsSpec
  const me = useMe()
  const myId = usePlayerId()
  const { t } = useTranslation()
  if (name) return name
  if (myId === playerId && me?.user?.name) return me.user.name
  if (isWithPlayerIdOptions(optionsSpec)) return optionsSpec.players.id.valueSpec(playerId).label(t)
  return t('Player {number}', { number: playerId })
}
