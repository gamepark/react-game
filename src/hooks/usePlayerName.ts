import { useGameSelector, useMe } from '@gamepark/react-client'
import { isWithPlayerIdOptions, OptionsSpecV2 } from '@gamepark/rules-api'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { gameContext } from '../components'
import { usePlayerId } from './usePlayerId'

/**
 * What to call a player.
 *
 * A player without a name is the ordinary case — a bot, or someone who has not signed in — and what they
 * are called then is their identity in the game: "White Tiger", not "Player 2". Where that text lives
 * depends on which spec the game declares. A v1 `OptionsSpec` carried the label itself; a v2 spec carries
 * structure only, and the text sits in the game's published options document under `identities.<value>`.
 *
 * Both are read, because both are in the wild: react-game ships independently of the games, so a front
 * built against an older rules package still hands over a v1 spec.
 */
export function usePlayerName<PlayerId = any>(playerId: PlayerId): string {
  const name = useGameSelector((state) => state.players.find(player => player.id === (playerId ?? state.playerId))?.name ?? '')
  const optionsSpec = useContext(gameContext).optionsSpec
  const me = useMe()
  const myId = usePlayerId()
  const { t } = useTranslation()
  const { t: tCommon } = useTranslation('common')
  // Never suspend on it. This hook is called all over a game's interface, and the options document is
  // fetched at runtime — a game whose bucket is slow, or which publishes nothing at all, would otherwise
  // hold its whole interface behind a request that is only there to spell a colour. Until it lands the
  // player reads "Player 2", then becomes "White Tiger".
  const { t: tOptions } = useTranslation('options', { useSuspense: false })
  if (name) return name
  if (myId === playerId) return me?.user?.name ?? tCommon('anonymous')
  if (playerId !== undefined) {
    if (isWithPlayerIdOptions(optionsSpec)) return optionsSpec.players.id.valueSpec(playerId).label(t)
    // Asked for only when the spec says the identity exists: `saveMissing` is on, so a blind lookup
    // would report a missing key for every player of every game that has no identities at all.
    if (declaresIdentities(optionsSpec)) {
      const identity = tOptions(`identities.${playerId}`, { defaultValue: '' })
      if (identity) return identity
    }
  }
  return tCommon('Player {number}', { number: playerId })
}

function declaresIdentities(optionsSpec: unknown): optionsSpec is OptionsSpecV2 & { identities: {} } {
  return (optionsSpec as OptionsSpecV2)?.specVersion === 2 && !!(optionsSpec as OptionsSpecV2).identities
}
