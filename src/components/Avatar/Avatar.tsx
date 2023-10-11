/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import Avataaar from '@gamepark/avataaars'
import { useMe } from '@gamepark/react-client'
import { HTMLAttributes } from 'react'
import { ChatSpeechBubble } from './ChatSpeechBubble'
import { SpeechBubble, SpeechBubbleProps } from './SpeechBubble'
import { usePlayer, usePlayerId } from '../../hooks'

type Props = {
  playerId: any
  speechBubbleProps?: SpeechBubbleProps
} & HTMLAttributes<HTMLDivElement>

export const Avatar = ({ playerId, speechBubbleProps, ...props }: Props) => {
  const player = usePlayer(playerId)
  const me = useMe()
  const myPlayerId = usePlayerId()
  const avatar = myPlayerId === playerId ? me?.user?.avatar ?? player?.avatar : player?.avatar
  const query = new URLSearchParams(window.location.search)
  const gameId = query.get('game')
  return (
    <div css={style} {...props}>
      <Avataaar circle {...avatar} css={avatarCss}/>
      {speechBubbleProps?.children ?
        <SpeechBubble {...speechBubbleProps}>{speechBubbleProps.children}</SpeechBubble> :
        gameId && player && <ChatSpeechBubble gameId={gameId} player={player} {...speechBubbleProps}/>
      }
    </div>
  )
}

const style = css`
  border-radius: 50%;
  box-shadow: 0 0 0.4em black;
`

const avatarCss = css`
  position: absolute;
  bottom: 0;
  left: -6%;
  width: 112%;
  height: 117%;
`
