/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import Avataaar from '@gamepark/avataaars'
import { useMe } from '@gamepark/react-client'
import { FC, forwardRef, HTMLAttributes } from 'react'
import { usePlayer, usePlayerId } from '../../hooks'
import { ChatSpeechBubble } from './ChatSpeechBubble'
import { SpeechBubble, SpeechBubbleProps } from './SpeechBubble'

type AvatarProps = {
  playerId: any
  speechBubbleProps?: SpeechBubbleProps
} & HTMLAttributes<HTMLDivElement>

export const Avatar= forwardRef<HTMLDivElement, AvatarProps>((props, ref) => {
  const { playerId, speechBubbleProps, children, ...rest } = props
  const player = usePlayer(playerId)
  const me = useMe()
  const myPlayerId = usePlayerId()
  const avatar = myPlayerId === playerId ? me?.user?.avatar ?? player?.avatar : player?.avatar
  return (
    <div ref={ref} css={style} {...rest}>
      <Avataaar circle {...avatar} css={[avatarCss, player?.quit && greyscale]}/>
      { !!speechBubbleProps && <AvatarSpeechBubble playerId={playerId} { ...speechBubbleProps }/> }
      {children}
    </div>
  )
})

type AvatarSpeechBubbleProps  = {
  playerId: any
} & SpeechBubbleProps

const AvatarSpeechBubble: FC<AvatarSpeechBubbleProps> = (props) => {
  const { playerId, ...speechBubbleProps } = props
  const player = usePlayer(playerId)
  const query = new URLSearchParams(window.location.search)
  const gameId = query.get('game')

  return (
    <>
      {speechBubbleProps?.children ?
        <SpeechBubble {...speechBubbleProps}>{speechBubbleProps.children}</SpeechBubble> :
        gameId && player && <ChatSpeechBubble gameId={gameId} player={player} {...speechBubbleProps}/>
      }
    </>
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

const greyscale = css`
  filter: grayscale();
`
