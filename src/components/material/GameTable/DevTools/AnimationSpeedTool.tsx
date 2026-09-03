/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { FC, useState } from 'react'
import {
  inlineRowCss, playerBtnActiveCss, playerBtnCss,
  toolBtnCss, toolDescCss, toolIconCss, toolLabelCss
} from './devtools.css'

type AnimationSpeedToolProps = {
  exec: (action: () => void, msg: string) => void
  g: any
}

const SPEEDS = [0.1, 0.25, 0.5, 1, 2, 5, 10]

const formatSpeed = (speed: number) => `\u00D7${speed}`

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
      <span css={toolIconCss}>{'\u00BB'}</span>
      <span css={toolLabelCss}>Animations Speed</span>
      <span css={toolDescCss}>Play animations faster or slower</span>
      <div css={[inlineRowCss, wrapCss]} onClick={e => e.stopPropagation()}>
        {SPEEDS.map(value => (
          <button key={value}
            css={[playerBtnCss, speedBtnCss, value === speed && playerBtnActiveCss]}
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

const wrapCss = css`
  flex-wrap: wrap;
`

const speedBtnCss = css`
  padding: 0 0.4em;
  font-variant-numeric: tabular-nums;
`
