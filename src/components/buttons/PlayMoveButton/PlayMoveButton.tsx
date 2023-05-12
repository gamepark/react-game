/** @jsxImportSource @emotion/react */
import { FC, HTMLAttributes } from 'react'
import { lightBlueButtonCss } from '../../../css'
import { PlayOptions, usePlay } from '../../../hooks'

export type PlayMoveButtonProps = {
  move: any
  onPlay?: () => void
} & PlayOptions & HTMLAttributes<HTMLButtonElement>

export const PlayMoveButton: FC<PlayMoveButtonProps> = ({ move, delayed, skipAnimation, local, onPlay, ...props }) => {
  const play = usePlay()
  return <button css={[lightBlueButtonCss]} onClick={() => {
    play(move, { delayed, skipAnimation, local })
    if (onPlay) onPlay()
  }} {...props}/>
}
