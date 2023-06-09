/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import Avataaar from '@gamepark/avataaars'
import { GameMode, GamePageState, useMe } from '@gamepark/react-client'
import { gameContext } from '../GameProvider'
import { HTMLAttributes, useContext } from 'react'
import { ChatSpeechBubble } from './ChatSpeechBubble'
import { SpeechBubble, SpeechBubbleProps } from './SpeechBubble'
import { usePlayer, usePlayerId } from '../../hooks'
import { useSelector } from 'react-redux'
import { isMaterialTutorial } from '../tutorial'

type Props = {
  playerId: any
  speechBubbleProps?: SpeechBubbleProps
} & HTMLAttributes<HTMLDivElement>

export const Avatar = ({ playerId, speechBubbleProps, ...props }: Props) => {
  const player = usePlayer(playerId)
  const isTutorial = useSelector((state: GamePageState) => state.gameMode === GameMode.TUTORIAL)
  const tutorial = useContext(gameContext).tutorial
  const tutorialAvatar = isTutorial && isMaterialTutorial(tutorial) && tutorial.avatars[playerId]
  const me = useMe()
  const myPlayerId = usePlayerId()
  const avatar = myPlayerId === playerId ? me?.user?.avatar : tutorialAvatar || player?.avatar
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
