/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { PlayOptions } from '@gamepark/react-client'
import { HTMLAttributes, ReactNode } from 'react'
import { transformCss } from '../../css'
import { usePlay } from '../../hooks'

export type ItemButtonProps = {
  move?: any
  moves?: any[]
  options?: PlayOptions
  label?: ReactNode
  labelPosition?: 'left' | 'right'
  x?: number
  y?: number
  angle?: number
  radius?: number
}

export const ItemMenuButton = (
  {
    move, moves = move ? [move] : [], options, label,
    angle = 0, radius = 3, x = radius * Math.sin(angle * Math.PI / 180), y = radius * -Math.cos(angle * Math.PI / 180),
    labelPosition = x > 0 ? 'left' : 'right',
    children, ...props
  }: ItemButtonProps & HTMLAttributes<HTMLButtonElement>
) => {
  const play = usePlay()
  return <button css={[itemMenuButtonCss, transformCss('translate(-50%, -50%)', `translate(${x}em, ${y}em)`)]}
                 onClick={() => {
                   for (const move of moves) play(move, options)
                 }} disabled={!moves.length} {...props}>
    {children}
    {label && <span css={[buttonLabelCss, labelPosition === 'left' ? labelLeft : labelRight]}>{label}</span>}
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
    display: flex;
    align-items: center;
    justify-content: center;
`

const buttonLabelCss = css`
  position: absolute;
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 0.3em;
`

const labelRight = css`
  padding: 0 0.2em 0 0.5em;
  top: 50%;
  right: 0.2em;
  transform: translate(100%, -50%) translateZ(-0.1em);
`

const labelLeft = css`
  padding: 0 0.5em 0 0.2em;
  top: 50%;
  left: 0.2em;
  transform: translate(-100%, -50%) translateZ(-0.1em);
`
