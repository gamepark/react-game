import { useGameSelector, useMe, usePlayerUser } from '@gamepark/react-client'
import { OptionsSpecV2 } from '@gamepark/rules-api'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { gameContext } from '../components'
import { usePlayerId } from './usePlayerId'

/**
 * What to call a player.
 *
 * A player without a name is the ordinary case — a bot, or someone who has not signed in — and what they
 * are called then is their identity in the game: "White Tiger", not "Player 2". The spec carries structure
 * only: the text sits in the game's published options document under `identities.<value>`.
 */
export function usePlayerName<PlayerId = any>(playerId: PlayerId): string {
  return usePlayerNameOrIdentity(playerId, true)
}

/** What to call a seat, whoever is looking at it: the tab sitting there reads "White Tiger" too, not its own user. */
export function usePlayerSeatName<PlayerId = any>(playerId: PlayerId): string {
  return usePlayerNameOrIdentity(playerId, false)
}

function usePlayerNameOrIdentity<PlayerId>(playerId: PlayerId, callMeByMyName: boolean): string {
  const player = useGameSelector((state) => state.players.find(player => player.id === (playerId ?? state.playerId)))
  const name = usePlayerUser(player).name
  const optionsSpec = useContext(gameContext).optionsSpec
  const me = useMe()
  const myId = usePlayerId()
  const { t: tCommon } = useTranslation('common')
  // Never suspend on it. This hook is called all over a game's interface, and the options document is
  // fetched at runtime — a game whose bucket is slow, or which publishes nothing at all, would otherwise
  // hold its whole interface behind a request that is only there to spell a colour. Until it lands the
  // player reads "Player 2", then becomes "White Tiger".
  const { t: tOptions } = useTranslation('options', { useSuspense: false })
  if (name) return name
  if (callMeByMyName && myId === playerId) return me?.user?.name ?? tCommon('anonymous')
  // Asked for only when the spec says the identity exists: `saveMissing` is on, so a blind lookup
  // would report a missing key for every player of every game that has no identities at all.
  if (playerId !== undefined && declaresIdentities(optionsSpec)) {
    const identity = tOptions(`identities.${playerId}`, { defaultValue: '' })
    if (identity) return identity
  }
  return tCommon('Player {number}', { number: playerId })
}

function declaresIdentities(optionsSpec: unknown): optionsSpec is OptionsSpecV2 & { identities: {} } {
  return (optionsSpec as OptionsSpecV2)?.specVersion === 2 && !!(optionsSpec as OptionsSpecV2).identities
}
