import { css, Interpolation, keyframes, Theme, useTheme } from '@emotion/react'
import { Player } from '@gamepark/react-client'
import { MaterialRules } from '@gamepark/rules-api'
import { FC, HTMLAttributes, ReactNode, useCallback } from 'react'
import { usePlayerName, useRules } from '../../hooks'
import { Avatar, SpeechBubbleProps } from '../Avatar'
import { MaterialFocus, useFocusContext } from '../material'
import { blinkOnRunningTimeout, PlayerTimer } from '../PlayerTimer'
import { Counters } from './Counters'
import { rightAlignment } from './playerPanelCss'

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
  /** Content of the speech bubble displayed next to the player avatar. Hides the chat bubble while displayed. */
  speak?: ReactNode
  /** Set to false to silence the avatar, true to keep the chat bubble even when no speech bubble props are given. */
  speechBubble?: boolean
  /** Overrides the speech bubble configuration (direction, css, event handlers...). */
  speechBubbleProps?: SpeechBubbleProps
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
    speechBubble,
    speechBubbleProps,
    ...rest
  } = props
  const theme = useTheme()
  const { setFocus } = useFocusContext()
  const playerName = usePlayerName(player.id)
  const gameOver = useRules()?.isOver()
  const rules = useRules<MaterialRules>()
  const isTurnToPlay = rules?.isTurnToPlay(player.id) ?? false
  const focusPlayer = useCallback(() => {
    if (!playerFocus) return
    setFocus(playerFocus)
  }, [playerFocus])
  const main = mainCounter? mainCounter: counters.length === 1? counters[0]: undefined
  const secondaryCounters = !mainCounter && counters.length === 1 ? []: counters
  const hasCounter = counters.length > 0 || !!mainCounter

  return (
    <div css={[panelPlayerStyle, panelStyle, backgroundImage && backgroundCss(backgroundImage), playerFocus && pointable, !hasCounter && noCounterCss, theme.playerPanel?.panel]}
         onClick={focusPlayer} {...rest}>
      <Avatar css={avatarStyle} playerId={player.id} speechBubble={speechBubble}
              speechBubbleProps={{ ...speechBubbleProps, children: speechBubbleProps?.children ?? speak }}/>
      {activeRing && isTurnToPlay && <div css={isPlaying}>
        <div css={isTurnToPlay && circleCss}/>
      </div>}
      <h2 css={[nameStyle, data, theme.playerPanel?.dataBadge]}>{playerName}</h2>
      {!main && (
        <div css={timerLine}>
          {!gameOver && (
            <PlayerTimer
              playerId={player.id}
              css={[timerStyle, data, theme.playerPanel?.dataBadge, rightAlignment]}
              customStyle={[halfOpacityOnPause, blinkOnRunningTimeout]}
            />
          )}
        </div>
      )}

      {main && (
        <div css={groupTimerAndCounter}>
          {!gameOver && (
            <PlayerTimer
              playerId={player.id}
              css={[timerStyle, data, theme.playerPanel?.dataBadge, rightAlignment]}
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

const noCounterCss = css`
  min-height: 8.1em;
`

// The timer line is always reserved, even when the timer is not displayed (game without timer, or game over):
// otherwise the counters move up under the avatar and overlap it.
const timerLine = css`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-height: 3.4em;
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
