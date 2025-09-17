import { css, Interpolation, keyframes, Theme } from '@emotion/react'
import { Player } from '@gamepark/react-client'
import { MaterialRules } from '@gamepark/rules-api'
import { FC, HTMLAttributes, ReactNode, RefObject, useCallback, useRef } from 'react'
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
  activeRing?: boolean
  timerOnRight?: boolean
  speak?: string | ReactNode
} & HTMLAttributes<HTMLDivElement>

export const StyledPlayerPanel: FC<StyledPlayerPanelProps> = (props) => {
  const {
    player,
    activeRing,
    timerOnRight,
    playerFocus,
    backgroundImage,
    counters = [],
    countersPerLine = 3,
    mainCounter,
    speak,
    ...rest
  } = props
  const { setFocus } = useFocusContext()
  const playerName = usePlayerName(player.id)
  const gameOver = useRules()?.isOver()
  const rules = useRules<MaterialRules>()
  const isTurnToPlay = rules?.isTurnToPlay(player.id) ?? false
  const panelRef = useRef<HTMLDivElement>(null)
  const focusPlayer = useCallback(() => {
    if (!playerFocus) return
    setFocus(playerFocus)
  }, [playerFocus])
  const main = mainCounter? mainCounter: counters.length === 1? counters[0]: undefined
  const secondaryCounters = !mainCounter && counters.length === 1 ? []: counters
  const hasCounter = counters.length > 0 || !!mainCounter

  return (
    <div ref={panelRef}
         css={[panelPlayerStyle, panelStyle, backgroundImage && backgroundCss(backgroundImage), playerFocus && pointable, !hasCounter && noCounterCss]}
         onClick={focusPlayer} {...rest}>
      <Avatar css={avatarStyle} playerId={player.id}
              speechBubbleProps={{ direction: getSpeechBubbleDirection(panelRef), children: typeof speak === 'string' ? <>{speak}</> : speak }}/>
      {activeRing && isTurnToPlay && <div css={isPlaying}>
        <div css={isTurnToPlay && circle}/>
      </div>}
      <h2 css={[nameStyle, data]}>{playerName}</h2>
      {!main && !gameOver && (
        <PlayerTimer
          playerId={player.id}
          css={[timerStyle, data, rightAlignment]}
          customStyle={[halfOpacityOnPause, blinkOnRunningTimeout]}
        />
      )}

      {main && (
        <div css={groupTimerAndCounter}>
          {!gameOver && (
            <PlayerTimer
              playerId={player.id}
              css={[timerStyle, data, rightAlignment]}
              customStyle={[halfOpacityOnPause, blinkOnRunningTimeout]}
            />
          )}
          <Counters counters={[main]} lineSize={1}/>
        </div>
      )}
      {secondaryCounters.length > 0 && (
        <div css={groupTimerAndCounters}>
          <Counters counters={secondaryCounters} lineSize={countersPerLine}/>
        </div>
      )}
    </div>
  )
}

const getSpeechBubbleDirection = (element: RefObject<HTMLDivElement | null>): SpeechBubbleDirection => {
  if (element.current) {
    const rect = element.current.getBoundingClientRect()
    const left = rect.left / (window.visualViewport?.width ?? window.innerWidth)
    const top = rect.top / (window.visualViewport?.height ?? window.innerHeight)
    const isLeft = (left > 0.2 && left < 0.5) || left > 0.8
    const isTop = (top > 0.2 && top < 0.5) || top > 0.8
    if (isLeft) {
      return isTop ? SpeechBubbleDirection.TOP_LEFT : SpeechBubbleDirection.BOTTOM_LEFT
    } else {
      return isTop ? SpeechBubbleDirection.TOP_RIGHT : SpeechBubbleDirection.BOTTOM_RIGHT
    }
  }

  return SpeechBubbleDirection.BOTTOM_RIGHT
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

const groupTimerAndCounters = css`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
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
  z-index: 3;
`
const nameStyle = css`
  align-self: end;
  max-width: 8em;
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
  z-index: 1;
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
  z-index: 2;
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
