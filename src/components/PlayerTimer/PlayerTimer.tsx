/** @jsxImportSource @emotion/react */
import { css, Interpolation, keyframes, Theme } from '@emotion/react'
import { HTMLAttributes } from 'react'
import { useSelector } from 'react-redux'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import utc from 'dayjs/plugin/utc'
import { usePlayerTime } from '../../hooks'
import { GamePageState } from '@gamepark/react-client'

dayjs.extend(duration)
dayjs.extend(utc)

export type PlayerTimerProps<PlayerId> = {
  playerId: PlayerId
  customStyle?: ((playing: boolean, timeLeft: number) => Interpolation<Theme>)[]
} & HTMLAttributes<HTMLSpanElement>

export const PlayerTimer = <PlayerId extends any>(
  { playerId, customStyle = [halfOpacityOnPause, blinkOnRunningTimeout], ...props }: PlayerTimerProps<PlayerId>
) => {
  const playing = useSelector((state: GamePageState) => state.players.find(p => p.id === playerId)?.time?.playing ?? false)
  const playerTime = usePlayerTime(playerId)
  if (!playerTime) return null
  return (
    <span {...props} css={customStyle.map(fc => fc(playing, playerTime))}>
      {playerTime < 0 && '-'}{humanizeTimer(Math.abs(playerTime))}
    </span>
  )
}

const halfOpacityOnPause = (playing: boolean) => !playing && css`
  opacity: 0.5;
`

const blinkKeyframes = keyframes`
  to {
    visibility: hidden;
  }
`

const blinkOnRunningTimeout = (playing: boolean, timeLeft: number) => playing && timeLeft < 0 && css`
  animation: ${blinkKeyframes} 1s steps(8, start) infinite;
`

const oneDay = dayjs.duration(1, 'day')
const oneHour = dayjs.duration(1, 'hour')

function humanizeTimer(duration: number) {
  if (duration >= oneDay.asMilliseconds()) {
    return dayjs.duration(duration).humanize()
  } else if (duration >= oneHour.asMilliseconds()) {
    return dayjs.utc(duration).format('HH:mm:ss')
  } else {
    return dayjs.utc(duration).format('mm:ss')
  }
}