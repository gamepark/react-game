/** @jsxImportSource @emotion/react */
import { useMutation } from '@apollo/client'
import { css } from '@emotion/react'
import { ACCEPT_REMATCH, menuButtonCss, NavButton, PLATFORM_URI, REFUSE_REMATCH, RematchData, useMe } from '@gamepark/react-client'
import { useChannel, useEvent } from '@harelpls/use-pusher'
import { useTranslation } from 'react-i18next'

type Props = {
  rematch: RematchData
}

export const RematchDisplay = ({ rematch }: Props) => {
  const { t } = useTranslation()
  const me = useMe()
  const [acceptRematch] = useMutation(ACCEPT_REMATCH)
  const [refuseRematch] = useMutation(REFUSE_REMATCH)
  const player = me && rematch.players.find(p => p.userId === me.user.id)
  const channel = useChannel('game-state=' + rematch.id)
  useEvent(channel, 'game-started', () => {
    if (player) {
      window.location.href = getGameLocation(rematch)
    }
  })
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

function getGameLocation(rematch: RematchData) {
  const url = new URL(window.location.href)
  url.searchParams.set('game', rematch.id)
  return url.toString()
}