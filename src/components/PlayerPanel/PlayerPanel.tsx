/** @jsxImportSource @emotion/react */
import { HTMLAttributes } from 'react'
import { usePlayerName, useRules } from '../../hooks'
import { GamePoints } from '../GamePoints'
import { Avatar, SpeechBubbleDirection } from '../Avatar'
import { PlayerTimer } from '../PlayerTimer'
import { css } from '@emotion/react'

export type PlayerPanelProps<PlayerId = any> = {
  playerId: PlayerId
  color?: string
} & HTMLAttributes<HTMLDivElement>

export const PlayerPanel = <PlayerId extends any>({ playerId, color = '#28B8CE', children, ...props }: PlayerPanelProps<PlayerId>) => {
  const playerName = usePlayerName(playerId)
  const rules = useRules()
  return (
    <div css={panelPlayerStyle(color, rules?.isTurnToPlay(playerId))} {...props}>
      <Avatar css={avatarStyle} playerId={playerId} speechBubbleProps={{ direction: SpeechBubbleDirection.BOTTOM_LEFT }}/>
      <h2 css={nameStyle}>{playerName}</h2>
      {!rules?.isOver() && <PlayerTimer playerId={playerId} css={timerStyle}/>}
      <GamePoints playerId={playerId} css={gamePointCss}/>
      {children}
    </div>
  )
}

const panelPlayerStyle = (color: string, active?: boolean) => css`
  background-color: ${active ? '#f0fbfc' : '#dddddd'};
  color: black;
  border: 0.5em solid ${color};
  border-radius: 3em 1.5em 1.5em 1.5em;
  box-shadow: 0 0 0.5em black, 0 0 0.5em black;
`

const avatarStyle = css`
  position: absolute;
  top: -0.1em;
  left: 0;
  border-radius: 100%;
  height: 6em;
  width: 6em;
  color: black;
`

const nameStyle = css`
  position: absolute;
  top: 0.3em;
  left: 3.1em;
  max-width: 7.3em;
  font-size: 2.4em;
  margin: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
`

const timerStyle = css`
  position: absolute;
  top: 1.6em;
  left: 3.1em;
  font-size: 2.5em;
`

const gamePointCss = css`
  position: absolute;
  top: 1.6em;
  left: 3.1em;
  font-size: 2.5em;
`
