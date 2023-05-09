/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react'
import { FC, HTMLAttributes } from 'react'

export const Header: FC<HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => (
  <div css={headerStyle} {...props}>
    <h1 css={titleStyle}>{children}</h1>
  </div>
)

const headerPadding = 10 // em
const fontSize = 4.5 // em

const scrollLongTextKeyframe = keyframes`
  0%, 30% {
    transform: none;
  }
  70%, 100% {
    transform: translateX(calc(100vw - ${headerPadding * 2 / fontSize}em - 100%));
  }
`

const headerStyle = css`
  position: absolute;
  width: 100%;
  height: 7em;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  text-align: center;
  padding: 0 ${headerPadding}em;
  overflow: hidden;
`

const titleStyle = css`
  white-space: nowrap;
  width: fit-content;
  min-width: 100%;
  margin: 0.2em 0;
  font-size: ${fontSize}em;
  animation: 8s ${scrollLongTextKeyframe} infinite linear;
`
