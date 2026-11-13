import { css, useTheme } from '@emotion/react'
import { subscribeToChannel, trpc, unsubscribeFromChannel, useMe } from '@gamepark/react-client'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { notifyGameChanged, platformGameUrl } from '../../../utilities/platform.util'
import { NavButton } from '../../menus/Menu/NavButton'
import { menuButtonCss, paletteMenuButtonCss } from '../../menus/menuCss'

type RematchData = {
  id: string
  startDate?: Date | null
  players: { id: any; name?: string; userId: string; ready: boolean }[]
}

type Props = {
  rematch: RematchData
}

export const RematchDisplay = ({ rematch }: Props) => {
  const { t } = useTranslation('common')
  const theme = useTheme()
  const me = useMe()
  const { mutate: acceptRematch } = trpc.rematch.acceptRematch.useMutation()
  const { mutate: refuseRematch } = trpc.rematch.refuseRematch.useMutation()
  const player = me?.user && rematch.players.find(p => p.userId === me.user.id)
  useEffect(() => {
    const channelName = 'game-state=' + rematch.id
    const channel = subscribeToChannel(channelName)
    const onGameStarted = () => {
      if (player) {
        notifyGameChanged(rematch.id)
        window.location.href = getGameLocation(rematch)
      }
    }
    channel.bind('game-started', onGameStarted)
    return () => {
      channel.unbind('game-started', onGameStarted)
      unsubscribeFromChannel(channelName)
    }
  }, [])
  return (
    <>
      <h3 css={rematchTitle}>{
        me?.user.id === rematch.players[0].userId ?
          t('rematch.mine') :
          rematch.startDate ?
            t('rematch.offered', { player: rematch.players[0].name }) :
            t('rematch.offer', { player: rematch.players[0].name })
      }</h3>
      {player && !player.ready && <div css={css`margin-bottom: 0.5em;`}>
        <button css={[menuButtonCss, paletteMenuButtonCss, theme.menu?.button, rematchButton, declineButton, theme.dialog.buttons]} onClick={() => refuseRematch(rematch.id)}>
          {t('rematch.decline')}
        </button>
        <button css={[menuButtonCss, paletteMenuButtonCss, theme.menu?.button, rematchButton, acceptButton, theme.dialog.buttons]} onClick={() => acceptRematch(rematch.id)}>
          {t('rematch.accept')}
        </button>
      </div>}
      <NavButton css={[rematchButton, theme.dialog.buttons]} url={platformGameUrl(rematch.id, new URLSearchParams(window.location.search).get('locale') || 'en')}>
        {t('rematch.go')}
      </NavButton>
    </>
  )
}

const rematchTitle = css`
  margin: 1em;
`

const acceptButton = css`
  margin-left: 1em;
  border: 0.05em solid #ffb24a;
  background-color: #ffb24a;

  &:focus, &:hover {
    background: #fea429;
  }

  &:active {
    background: #ff9608;
  }
`

const declineButton = css`
  border: 0.05em solid #bbb;
  background-color: #bbb;

  &:focus, &:hover {
    background: #aaa;
  }

  &:active {
    background: #999;
  }
`

const rematchButton = css`
  display: inline-block;
  padding: 0.4em 0.6em;
`

const getGameLocation = (rematch: RematchData) => {
  const url = new URL(window.location.href)
  url.searchParams.set('game', rematch.id)
  return url.toString()
}