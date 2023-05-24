/** @jsxImportSource @emotion/react */
import { ButtonHTMLAttributes, FC, useCallback } from 'react'
import { PlayOptions, usePlay } from '../../../hooks'
import { ThemeButton } from '../ThemeButton'

export type PlayMoveButtonProps = {
  move: any
  onPlay?: () => void
} & PlayOptions & ButtonHTMLAttributes<HTMLButtonElement>

export const PlayMoveButton: FC<PlayMoveButtonProps> = ({ move, delayed, skipAnimation, local, onPlay, ...props }) => {
  const play = usePlay()
  const onClick = useCallback(() => {
    play(move, { delayed, skipAnimation, local })
    if (onPlay) onPlay()
  }, [move, delayed, skipAnimation, local, onPlay])
  return <ThemeButton onClick={onClick} disabled={move === undefined} {...props}/>
}
