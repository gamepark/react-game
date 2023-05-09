/** @jsxImportSource @emotion/react */
import { FC, HTMLAttributes } from 'react'
import { lightBlueButtonCss } from '../../../css'
import { PlayOptions, usePlay } from '../../../hooks'

export type PlayMoveButtonProps = {
  move: any
} & PlayOptions & HTMLAttributes<HTMLButtonElement>

export const PlayMoveButton: FC<PlayMoveButtonProps> = ({ move, delayed, skipAnimation, local, ...props }) => {
  const play = usePlay()
  return <button css={[lightBlueButtonCss]} onClick={() => play(move, { delayed, skipAnimation, local })} {...props}/>
}
