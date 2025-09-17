import { css } from '@emotion/react'
import { HTMLAttributes } from 'react'

export type LetterboxProps = {
  width?: number
  height?: number
  left?: number
  top?: number
} & HTMLAttributes<HTMLDivElement>

export const Letterbox = ({ children, width = 16, height = 9, left = 50, top = 50, ...props }: LetterboxProps) => <div
  css={[container(left, top), aspectRatio(width, height)]} {...props}>
  <canvas css={[canvas, aspectRatio(width, height)]} width={width} height={height}/>
  <div css={content}>
    {children}
  </div>
</div>

const aspectRatio = (width: number, height: number) => css`
  @media (min-aspect-ratio: ${width}/${height}) {
    height: 100%;
  }
  @media (max-aspect-ratio: ${width}/${height}) {
    width: 100%;
  }
`

const container = (left: number, top: number) => css`
  position: absolute;
  display: inline-block;
  left: ${left}%;
  top: ${top}%;
  transform: translate(-${left}%, -${top}%);
`

const canvas = css`
  padding: 0;
  margin: 0;
`

const content = css`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
`