/** @jsxImportSource @emotion/react */
import { Player, PlayerQuitReason, useGameSelector, useMe } from '@gamepark/react-client'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePlayerName } from '../../../hooks'
import { Dialog } from '../../dialogs'
import { menuButtonCss, menuDialogCss } from '../menuCss'

export const TrackPlayersQuit = () => {
  const players = useGameSelector((state) => state.players)
  return <>{players.map(player => <TrackPlayerQuit key={player.id} player={player}/>)}</>
}

const TrackPlayerQuit = ({ player }: { player: Player }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const me = useMe()
  const playerName = usePlayerName(player.id)
  const [alreadyQuit] = useState(player.quit)
  useEffect(() => {
    if (!alreadyQuit && player.quit) setOpen(true)
  }, [player.quit])
  if (!player.quit) return null
  return <Dialog css={menuDialogCss} open={open}>
    <p>{player.userId === me?.user.id ? (
      player.quitReason === PlayerQuitReason.Ejected ?
        t('quit.you.ejected')
        : t('quit.you')
    ) : (
      player.quitReason === PlayerQuitReason.Ejected ?
        t('quit.player.ejected', { player: playerName })
        : t('quit.player', { player: playerName })
    )
    }</p>
    <button css={menuButtonCss} onClick={() => setOpen(false)}>{t('OK')}</button>
  </Dialog>
}