/** @jsxImportSource @emotion/react */
import { FC, HTMLAttributes, useCallback } from 'react'
import { PlayOptions, usePlay } from '../../../hooks'
import { ThemeButton } from '../ThemeButton'

export type PlayMoveButtonProps = {
  move: any
  onPlay?: () => void
} & PlayOptions & HTMLAttributes<HTMLButtonElement>

export const PlayMoveButton: FC<PlayMoveButtonProps> = ({ move, delayed, skipAnimation, local, onPlay, ...props }) => {
  const play = usePlay()
  const onClick = useCallback(() => {
    play(move, { delayed, skipAnimation, local })
    if (onPlay) onPlay()
  }, [move, delayed, skipAnimation, local, onPlay])
  return <ThemeButton onClick={onClick} {...props}/>
}
