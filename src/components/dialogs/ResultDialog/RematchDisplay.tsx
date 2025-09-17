import { useMutation } from '@apollo/client/react'
import { css } from '@emotion/react'
import { ACCEPT_REMATCH, PLATFORM_URI, pusherClient, REFUSE_REMATCH, RematchData, useMe } from '@gamepark/react-client'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { NavButton } from '../../menus/Menu/NavButton'
import { menuButtonCss } from '../../menus/menuCss'

type Props = {
  rematch: RematchData
}

export const RematchDisplay = ({ rematch }: Props) => {
  const { t } = useTranslation()
  const me = useMe()
  const [acceptRematch] = useMutation(ACCEPT_REMATCH)
  const [refuseRematch] = useMutation(REFUSE_REMATCH)
  const player = me?.user && rematch.players.find(p => p.userId === me.user.id)
  useEffect(() => {
    const channel = pusherClient.subscribe('game-state=' + rematch.id)
    channel.bind('game-started', () => {
      if (player) {
        window.location.href = getGameLocation(rematch)
      }
    })
    return () => pusherClient.unsubscribe('game-state=' + rematch.id)
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
        <button css={[menuButtonCss, rematchButton, declineButton]} onClick={() => refuseRematch({ variables: { gameId: rematch.id } })}>
          {t('rematch.decline')}
        </button>
        <button css={[menuButtonCss, rematchButton, acceptButton]} onClick={() => acceptRematch({ variables: { gameId: rematch.id } })}>
          {t('rematch.accept')}
        </button>
      </div>}
      <NavButton css={rematchButton} url={`${PLATFORM_URI}/?id=${rematch.id}`}>
        {t('rematch.go')}
      </NavButton>
    </>
  )
}

const rematchTitle = css`
  margin: 1em;
  font-size: 1.25em;
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