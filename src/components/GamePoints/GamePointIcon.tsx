import { css } from '@emotion/react'
import { SVGProps } from 'react'

export const GamePointIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="210 150 420 300" css={style} {...props}>
    <path fill="#002448" d="M493.7,138.3v55.4h-79.1c0,0-28-5.6-28.5,39c-0.6,44.3,0,152.2,0,152.2H433l0.6-74.3h-20.1l-0.6-57.9h80.8
		v191.2H374.2c0,0-57.3-10.4-48.9-73.1l-0.8-159.6c0,0,8.2-68.9,78.8-75.4L493.7,138.3z"/>
    <circle fill="#002448" cx="259.7" cy="317.4" r="20.7"/>
    <circle fill="#002448" cx="547.8" cy="317.4" r="20.7"/>
    <path fill="#28B8CE" d="M479.6,146.7V202h-79.1c0,0-28-5.6-28.5,39c-0.6,44.3,0,152.2,0,152.2h46.9l0.6-74.3h-20.1l-0.6-57.9h80.8
		v191.2H360.1c0,0-57.3-10.4-48.9-73.1l-0.8-159.6c0,0,8.2-68.9,78.8-75.4L479.6,146.7z"/>
  </svg>
)

const style = css`
  height: 1em;
  width: 1.3em;
`
