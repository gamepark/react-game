/** @jsxImportSource @emotion/react */
import { css, Interpolation, keyframes, Theme } from '@emotion/react'
import { GamePageState, Player } from '@gamepark/react-client'
import { MaterialRules } from '@gamepark/rules-api'
import { FC, HTMLAttributes, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { usePlayerName, useRules } from '../../hooks'
import { Avatar, SpeechBubbleDirection } from '../Avatar'
import { MaterialFocus, useFocusContext } from '../material'
import { blinkOnRunningTimeout, PlayerTimer } from '../PlayerTimer'
import { Counters } from './Counters'

type CountersProps = {
  image: string
  value: number | string
} & { imageCss?: Interpolation<Theme> }

type StyledPlayerPanelProps = {
  player: Player
  mainCounter?: CountersProps
  counters?: CountersProps[]
  countersPerLine?: number,
  backgroundImage?: string
  playerFocus?: MaterialFocus
  color?: string
  activeRing?: boolean
  timerOnRight?: boolean
} & HTMLAttributes<HTMLDivElement>

export const StyledPlayerPanel: FC<StyledPlayerPanelProps> = (props) => {
  const { player, activeRing, timerOnRight, color = '#28B8CE', playerFocus, backgroundImage, counters = [], countersPerLine = 2, mainCounter, ...rest } = props
  const allCounter = mainCounter ? [mainCounter, ...counters] : counters ?? []
  const { setFocus } = useFocusContext()
  const playerName = usePlayerName(player.id)
  const gameOver = useSelector((state: GamePageState) => state.gameOver)
  const rules = useRules<MaterialRules>()
  const isTurnToPlay = rules?.isTurnToPlay(player.id) ?? false
  const focusPlayer = useCallback(() => {
    if (!playerFocus) return
    setFocus(playerFocus)
  }, [playerFocus])
  return (
    <div css={[panelPlayerStyle, panelStyle, backgroundImage && backgroundCss(backgroundImage), playerFocus && pointable, !allCounter.length && noCounterCss]} onClick={focusPlayer} {...rest}>
      <Avatar css={avatarStyle} playerId={player.id} speechBubbleProps={{ direction: SpeechBubbleDirection.BOTTOM_LEFT }}/>
      {activeRing && isTurnToPlay && <div css={isPlaying}>
        <div css={isTurnToPlay && circle}/>
      </div>}
      <h2 css={[nameStyle, data]}>{playerName}</h2>
      {!allCounter.length && !gameOver &&
        (
          <PlayerTimer playerId={player.id} css={[timerStyle, data, rightAlignment]}
                       customStyle={[halfOpacityOnPause, blinkOnRunningTimeout]}/>
        )
      }

      {allCounter.length === 1 && (
        <div css={groupTimerAndCounter}>
          {!gameOver && <PlayerTimer playerId={player.id} css={[timerStyle, data, rightAlignment]}
                                     customStyle={[halfOpacityOnPause, blinkOnRunningTimeout]}/>}
          <Counters counters={allCounter} lineSize={countersPerLine}/>
        </div>
      )}
      {allCounter.length > 1 && (
        <>
          {!gameOver && <PlayerTimer playerId={player.id} css={[timerStyle, data, rightAlignment]}
                                     customStyle={[halfOpacityOnPause, blinkOnRunningTimeout]}/>}
          <Counters counters={allCounter} lineSize={countersPerLine}/>
        </>
      )}
    </div>
  )
}

const noCounterCss = css`
  min-height: 8.1em;
`

const groupTimerAndCounter = css`
  display: flex;
  flex-direction: row;
  align-self: flex-end;
  gap: 0.5em;
`

const halfOpacityOnPause = (playing: boolean) => !playing && css`
  opacity: 0.8;
`

const rightAlignment = css`
  left: initial;
  right: 0.2em;
  font-size: 2.5em;
`

const panelPlayerStyle = css`
  color: black;
  border-radius: 3em 1.5em 1.5em 1.5em;
  box-shadow: 0 0 0.5em black, 0 0 0.5em black;
  width: 28em;
  display: flex;
  flex-direction: column;
  gap: 0.4em;
  padding: 0.5em;
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
  align-self: end;
  max-width: 7.3em;
  margin: 0;
  font-size: 2.4em;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
`

const backgroundCss = (backgroundImage: string) => css`
  background: rgba(0, 0, 0, 0.8) url(${backgroundImage});
  background-size: cover;
  background-repeat: no-repeat;
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

const timerStyle = css`
  align-self: end;
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