/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { PlayOptions } from '@gamepark/react-client'
import { HTMLAttributes, ReactNode } from 'react'
import { usePlay } from '../../hooks'

export type ItemButtonProps = {
  label?: ReactNode
  angle: number
  radius?: number
  move: any
  options?: PlayOptions
}

export const ItemMenuButton = (
  { label, angle, radius = 3, move, options, children, ...props }: ItemButtonProps & HTMLAttributes<HTMLButtonElement>
) => {
  const play = usePlay()
  return <button css={[itemMenuButtonCss, buttonPositionCss(angle * Math.PI / 180, radius)]}
                 onClick={() => play(move, options)} {...props}>
    {children}
    {label && <span css={[buttonLabelCss, (angle % 360 + 360) % 360 < 180 ? labelLeft : labelRight]}>{label}</span>}
  </button>
}

const itemMenuButtonCss = css`
  transform-style: preserve-3d;
  width: 2em;
  height: 2em;
  border-radius: 1em;
  background-color: white;
  color: black;
  cursor: pointer;
`

const buttonPositionCss = (angle: number, radius: number) => css`
  transform: translate(-50%, -50%) translate(${radius * Math.sin(angle)}em, ${radius * -Math.cos(angle)}em);
`

const buttonLabelCss = css`
  position: absolute;
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 0.3em;
`

const labelLeft = css`
  padding: 0 0.2em 0 0.5em;
  top: 50%;
  right: 0.2em;
  transform: translate(100%, -50%) translateZ(-0.1em);
`

const labelRight = css`
  padding: 0 0.5em 0 0.2em;
  top: 50%;
  left: 0.2em;
  transform: translate(-100%, -50%) translateZ(-0.1em);
`