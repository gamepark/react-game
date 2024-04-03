/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react'
import { GamePageState, useOptions } from '@gamepark/react-client'
import { GameSpeed, MaterialRules } from '@gamepark/rules-api'
import { FC, HTMLAttributes, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { usePlayer, usePlayerName, useRules } from '../../hooks'
import { Avatar, SpeechBubbleDirection } from '../Avatar'
import { MaterialFocus, useFocusContext } from '../material'
import { Picture } from '../Picture'
import { PlayerTimer } from '../PlayerTimer'

type MainCounterProps = {
  image: string
  value: number | string
}

type StyledPlayerPanelProps<PlayerId extends number = number> = {
  playerId: PlayerId
  mainCounter?: MainCounterProps
  backgroundImage?: string
  getPlayerFocus?: (playerId?: number) => MaterialFocus
  activeRing?: boolean
} & HTMLAttributes<HTMLDivElement>

export const StyledPlayerPanel: FC<StyledPlayerPanelProps> = (props) => {
  const { playerId, activeRing, getPlayerFocus, backgroundImage, ...rest } = props
  const { setFocus } = useFocusContext()
  const playerName = usePlayerName(playerId)
  const gameOver = useSelector((state: GamePageState) => state.gameOver)
  const rules = useRules<MaterialRules>()
  const isTurnToPlay = rules?.isTurnToPlay(playerId) ?? false
  const focusPlayer = useCallback(() => {
    if (!getPlayerFocus) return
    setFocus(getPlayerFocus(playerId))
  }, [getPlayerFocus])
  return (
    <>
      <div css={[panelPlayerStyle, panelStyle, backgroundImage && backgroundCss(backgroundImage), getPlayerFocus && pointable]} onClick={focusPlayer} {...rest}>
        <Avatar css={avatarStyle} playerId={playerId} speechBubbleProps={{ direction: SpeechBubbleDirection.BOTTOM_LEFT }}/>
        {activeRing && isTurnToPlay && <div css={isPlaying}>
          <div css={isTurnToPlay && circle}/>
        </div>}
        <h2 css={[nameStyle, data]}>{playerName}</h2>
        {!gameOver && <PlayerTimer playerId={playerId} css={[timerStyle, data]}/>}
        <MainIcon {...props} />
      </div>

    </>
  )
}

const MainIcon: FC<StyledPlayerPanelProps> = (props) => {
  const { playerId, mainCounter } = props
  const { image, value } = mainCounter ?? {}
  const player = usePlayer(playerId)
  const options = useOptions()
  const speedDisabled = options?.speed !== GameSpeed.RealTime || !player?.time
  if (image === undefined && value === undefined) return null

  return (
    <span css={[data, counter, speedDisabled && rightAlignment]}>
      <Picture css={mini} src={image}/>
      <span>{value}</span>
    </span>
  )
}

const rightAlignment = css`
  bottom: 0.2em;
  left: initial;
  right: 0.25em;
  font-size: 2.5em;
`
const mini = css`
  height: 1.05em;
  margin-bottom: -0.17em;
  border: 0.01em solid white;
  border-radius: 5em;
`

const counter = css`
  position: absolute;
  width: 3.5em;
  font-size: 2.5em;
  bottom: 0.2em;
  left: initial;
  right: 0.25em;
  display: flex;
  height: 1.35em;

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
const nameStyle = css`
  position: absolute;
  top: 0.2em;
  left: initial;
  right: 0.3em;
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

const pointable = css`
  cursor: pointer;
`

const panelStyle = css`

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

const timerStyle = css`
  position: absolute;
  bottom: 0.2em;
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