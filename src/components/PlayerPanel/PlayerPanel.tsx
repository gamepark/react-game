import { css, keyframes, useTheme } from '@emotion/react'
import { MaterialRules } from '@gamepark/rules-api'
import { FC, HTMLAttributes, ReactNode } from 'react'
import { usePlayerName, useRules } from '../../hooks'
import { Avatar, SpeechBubbleProps } from '../Avatar'
import { GamePoints } from '../GamePoints'
import { PlayerTimer } from '../PlayerTimer'

export type PlayerPanelProps<PlayerId extends number = number> = {
  playerId: PlayerId
  color?: string,
  activeRing?: boolean
  /** Content of the speech bubble displayed next to the player avatar. Hides the chat bubble while displayed. */
  speak?: ReactNode
  /** Set to false to silence the avatar, true to keep the chat bubble even when no speech bubble props are given. */
  speechBubble?: boolean
  /** Overrides the speech bubble configuration (direction, css, event handlers...). */
  speechBubbleProps?: SpeechBubbleProps
} & HTMLAttributes<HTMLDivElement>

export const PlayerPanel: FC<PlayerPanelProps> = (p) => {
  const { playerId, activeRing, color, children, speak, speechBubble, speechBubbleProps, ...props } = p
  const theme = useTheme()
  const resolvedColor = color ?? 'var(--gp-primary)'
  const playerName = usePlayerName(playerId)
  const rules = useRules<MaterialRules>()
  const isTurnToPlay = rules?.isTurnToPlay(playerId) ?? false
  return (
    <div css={[panelPlayerStyle(resolvedColor, isTurnToPlay), theme.playerPanel?.panel]} {...props}>
      <Avatar css={avatarStyle} playerId={playerId} speechBubble={speechBubble}
              speechBubbleProps={{ ...speechBubbleProps, children: speechBubbleProps?.children ?? speak }}/>
      {activeRing && isTurnToPlay && <div css={isPlaying}>
        <div css={isTurnToPlay && circleCss}/>
      </div>}
      <h2 css={nameStyle}>{playerName}</h2>
      {!rules?.isOver() && <PlayerTimer playerId={playerId} css={timerStyle}/>}
      <GamePoints playerId={playerId} css={gamePointCss}/>
      {children}
    </div>
  )
}

const panelPlayerStyle = (color: string, active?: boolean) => css`
  background-color: ${active ? 'var(--gp-primary-light)' : '#dddddd'};
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
const circleCss = css`
  background-image: linear-gradient(
          to bottom, var(--gp-ring-color-1) 0%,
          var(--gp-ring-color-2) 100%);
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
