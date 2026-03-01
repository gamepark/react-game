import { css, keyframes, useTheme } from '@emotion/react'
import { MaterialRules } from '@gamepark/rules-api'
import { FC, HTMLAttributes, ReactNode } from 'react'
import { usePlayerName, useRules } from '../../hooks'
import { Avatar, SpeechBubbleDirection } from '../Avatar'
import { GamePoints } from '../GamePoints'
import { PlayerTimer } from '../PlayerTimer'

export type PlayerPanelProps<PlayerId extends number = number> = {
  playerId: PlayerId
  color?: string,
  activeRing?: boolean
  speak?: string | ReactNode
} & HTMLAttributes<HTMLDivElement>

export const PlayerPanel: FC<PlayerPanelProps> = (p) => {
  const { playerId, activeRing, color, children, speak, ...props } = p
  const theme = useTheme()
  const resolvedColor = color ?? theme.palette.primary
  const playerName = usePlayerName(playerId)
  const rules = useRules<MaterialRules>()
  const isTurnToPlay = rules?.isTurnToPlay(playerId) ?? false
  const ringColors = theme.playerPanel?.activeRingColors ?? ['gold', theme.palette.primary]
  return (
    <div css={panelPlayerStyle(resolvedColor, isTurnToPlay, theme.palette.primaryLight)} {...props}>
      <Avatar css={avatarStyle} playerId={playerId}
              speechBubbleProps={{ direction: SpeechBubbleDirection.BOTTOM_LEFT, children: typeof speak === 'string' ? <>{speak}</> : speak }}/>
      {activeRing && isTurnToPlay && <div css={isPlaying}>
        <div css={isTurnToPlay && circleCss(ringColors)}/>
      </div>}
      <h2 css={nameStyle}>{playerName}</h2>
      {!rules?.isOver() && <PlayerTimer playerId={playerId} css={timerStyle}/>}
      <GamePoints playerId={playerId} css={gamePointCss}/>
      {children}
    </div>
  )
}

const panelPlayerStyle = (color: string, active?: boolean, activeBackground?: string) => css`
  background-color: ${active ? (activeBackground ?? '#f0fbfc') : '#dddddd'};
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
  z-index: 1;
`

const isPlaying = css`
  position: absolute;
  top: -0.1em;
  left: 0;
  border-radius: 50%;
  height: 6em;
  width: 6em;
  color: black;
  z-index: 0;
`

const circleAnimation = keyframes`
  to {
    transform: rotateZ(0);
  }
  from {
    transform: rotateZ(360deg);
  }
`

const inset = 0.8
const circleCss = (colors: [string, string]) => css`
  background-image: linear-gradient(
          to bottom, ${colors[0]} 0%,
          ${colors[1]} 100%);
  position: absolute;
  top: -${inset}em;
  bottom: -${inset}em;
  right: -${inset}em;
  left: -${inset}em;
  border-radius: inherit;
  animation: ${circleAnimation} 1s infinite linear;
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
