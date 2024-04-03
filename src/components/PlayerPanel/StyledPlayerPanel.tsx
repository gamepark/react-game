/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react'
import { GamePageState, Player, useOptions } from '@gamepark/react-client'
import { GameSpeed, MaterialRules } from '@gamepark/rules-api'
import { FC, HTMLAttributes, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { usePlayerName, useRules } from '../../hooks'
import { Avatar, SpeechBubbleDirection } from '../Avatar'
import { MaterialFocus, useFocusContext } from '../material'
import { Picture } from '../Picture'
import { PlayerTimer } from '../PlayerTimer'

type MainCounterProps = {
  image: string
  value: number | string
}

type StyledPlayerPanelProps = {
  player: Player
  mainCounter?: MainCounterProps
  backgroundImage?: string
  playerFocus?: MaterialFocus
  color?: string
  activeRing?: boolean
} & HTMLAttributes<HTMLDivElement>

export const StyledPlayerPanel: FC<StyledPlayerPanelProps> = (props) => {
  const { player, activeRing, color = '#28B8CE', playerFocus, backgroundImage, mainCounter, ...rest } = props
  const { setFocus } = useFocusContext()
  const playerName = usePlayerName(player.id)
  const gameOver = useSelector((state: GamePageState) => state.gameOver)
  const options = useOptions()
  const speedDisabled = options?.speed !== GameSpeed.RealTime || !player?.time
  const rules = useRules<MaterialRules>()
  const isTurnToPlay = rules?.isTurnToPlay(player.id) ?? false
  const focusPlayer = useCallback(() => {
    if (!playerFocus) return
    setFocus(playerFocus)
  }, [playerFocus])
  return (
    <>
      <div css={[panelPlayerStyle, panelStyle, backgroundImage? backgroundCss(backgroundImage): noBackgroundCss(color, isTurnToPlay), playerFocus && pointable]} onClick={focusPlayer} {...rest}>
        <Avatar css={avatarStyle} playerId={player.id} speechBubbleProps={{ direction: SpeechBubbleDirection.BOTTOM_LEFT }}/>
        {activeRing && isTurnToPlay && <div css={isPlaying}>
          <div css={isTurnToPlay && circle}/>
        </div>}
        <h2 css={[nameStyle(!!backgroundImage), data]}>{playerName}</h2>
        {!gameOver && <PlayerTimer playerId={player.id} css={[timerStyle(!!backgroundImage), data, !speedDisabled && rightAlignment(!!backgroundImage)]}/>}
        {!!mainCounter && <MainIcon {...props} {...mainCounter} hasBackground={!!backgroundImage} />}
      </div>

    </>
  )
}

const MainIcon: FC<{ player: Player, hasBackground: boolean } & MainCounterProps> = (props) => {
  const { player, hasBackground, image, value } = props
  const options = useOptions()
  const speedDisabled = options?.speed !== GameSpeed.RealTime || !player?.time
  if (image === undefined && value === undefined) return null
  return (
    <span css={[data, counter(hasBackground), speedDisabled && rightAlignment(hasBackground)]}>
      <Picture css={mini} src={image}/>
      <span>{value}</span>
    </span>
  )
}

const rightAlignment = (hasBackground: boolean) => css`
  left: initial;
  right: ${hasBackground? 0.2: 0.15}em;
  font-size: 2.5em;
`
const mini = css`
  height: 1.05em;
  margin-bottom: -0.17em;
  border: 0.01em solid white;
  border-radius: 5em;
`

const counter = (hasBackground: boolean) =>
  css`
    position: absolute;
    width: 3.5em;
    font-size: 2.5em;
    bottom: ${hasBackground ? 0.2 : 0.1}em;
    left: initial;
    right: 0.25em;
    display: flex;
    height: 1.3em;
  
    > span {
      text-align: right;
      width: 1.7em;
    }
  `

const panelPlayerStyle = css`
  color: black;
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
const nameStyle = (hasBackground: boolean) => css`
  position: absolute;
  top: ${hasBackground? 0.2: 0.1}em;
  left: initial;
  right: ${hasBackground? 0.2: 0.15}em;
  max-width: 7.3em;
  font-size: 2.4em;
  margin: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
`

const backgroundCss = (backgroundImage: string) => css`
  background: rgba(0, 0, 0, 0.8) url(${backgroundImage});
  background-size: 120% auto;
  background-repeat: no-repeat;
`

const noBackgroundCss = (color: string, active?: boolean) => css`
  background-color: ${active ? '#f0fbfc' : '#dddddd'};
  border: 0.5em solid ${color};
`

const pointable = css`
  cursor: pointer;
`

const panelStyle = css`
  background-color: white;
  &:after {
    content: '';
    position: absolute;
    top: 0;
    height: 100%;
    width: 100%;
    left: 0;
    border-radius: 1em;
  }
`

const data = css`
  color: white;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 0.1em 0.3em;
  border-radius: 0.4em;
  z-index: 2;
`

const timerStyle = (hasBackground: boolean) => css`
  position: absolute;
  bottom: ${hasBackground? 0.2: 0.1}em;
  left: initial;
  right: 4.1em;
  font-size: 2.5em;
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
const circle = css`
  background-image: linear-gradient(
          to bottom, gold 0%,
          rgb(40, 184, 206) 100%);
  position: absolute;
  top: -${inset}em;
  bottom: -${inset}em;
  right: -${inset}em;
  left: -${inset}em;
  border-radius: inherit;
  animation: ${circleAnimation} 1s infinite linear;
`