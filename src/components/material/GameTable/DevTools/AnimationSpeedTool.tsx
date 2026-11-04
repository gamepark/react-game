/** @jsxImportSource @emotion/react */
import { faForwardFast } from '@fortawesome/free-solid-svg-icons/faForwardFast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FC, useState } from 'react'
import {
  segmentActiveCss, segmentCss, segmentedCss, toolBtnCss, toolDescCss, toolIconCss, toolLabelCss
} from './devtools.css'

type AnimationSpeedToolProps = {
  exec: (action: () => void, msg: string) => void
  g: any
}

const SPEEDS = [0.1, 0.25, 0.5, 1, 2, 5, 10]

const formatSpeed = (speed: number) => `×${speed}`

/* The animations speed is persisted by the GameLocalAPI under the
 * global `animationsSpeed` localStorage key, so we read it back on
 * mount to open in sync with the actual speed (including reloads or
 * changes made from the console with `game.setAnimationsSpeed()`). */
export const AnimationSpeedTool: FC<AnimationSpeedToolProps> = ({ exec, g }) => {
  const [speed, setSpeed] = useState<number>(() => {
    if (typeof window === 'undefined') return 1
    const stored = parseFloat(window.localStorage.getItem('animationsSpeed') || '1')
    return isNaN(stored) || stored <= 0 ? 1 : stored
  })

  return (
    <div css={toolBtnCss}>
      <span css={toolIconCss}><FontAwesomeIcon icon={faForwardFast}/></span>
      <span css={toolLabelCss}>Animations Speed</span>
      <span css={toolDescCss}>Play animations faster or slower</span>
      <div css={segmentedCss} role="group" aria-label="Animations speed">
        {SPEEDS.map(value => (
          <button key={value} aria-pressed={value === speed}
            css={[segmentCss, value === speed && segmentActiveCss]}
            onClick={() => {
              exec(() => g.setAnimationsSpeed(value), `Animations ${formatSpeed(value)}`)
              setSpeed(value)
            }}>
            {formatSpeed(value)}
          </button>
        ))}
      </div>
    </div>
  )
}
