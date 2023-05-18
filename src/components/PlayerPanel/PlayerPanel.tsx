/** @jsxImportSource @emotion/react */
import { HTMLAttributes, useContext } from 'react'
import { usePlayer, useRules } from '../../hooks'
import { useTranslation } from 'react-i18next'
import { GamePoints } from '../GamePoints'
import { gameContext } from '../../../../workshop/packages/react-client'
import { getFallbackPlayerName } from '../../../../workshop/packages/rules-api'
import { Avatar, SpeechBubbleDirection } from '../Avatar'
import { PlayerTimer } from '../PlayerTimer'
import { css } from '@emotion/react'

export type PlayerPanelProps<PlayerId = any> = {
  playerId: PlayerId
  color?: string
} & HTMLAttributes<HTMLDivElement>

export const PlayerPanel = <PlayerId extends any>({ playerId, color = '#28B8CE', ...props }: PlayerPanelProps<PlayerId>) => {
  const { t } = useTranslation()
  const playerInfo = usePlayer(playerId)
  const optionsSpec = useContext(gameContext).optionsSpec
  const rules = useRules()
  return (
    <div css={panelPlayerStyle(color, rules?.isTurnToPlay(playerId))} {...props}>
      <Avatar css={avatarStyle} playerId={playerId} speechBubbleProps={{ direction: SpeechBubbleDirection.BOTTOM_LEFT }}/>
      <h2 css={nameStyle}>{playerInfo?.name ?? getFallbackPlayerName(playerId, t, optionsSpec)}</h2>
      {!rules?.isOver() && <PlayerTimer playerId={playerId} css={timerStyle}/>}
      <GamePoints playerId={playerId} css={gamePointCss}/>
    </div>
  )
}

const panelPlayerStyle = (color: string, active?: boolean) => css`
  background-color: ${active ? '#f0fbfc' : '#dddddd'};
  color: black;
  border: 0.5em solid ${color};
  border-radius: 3em;
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
