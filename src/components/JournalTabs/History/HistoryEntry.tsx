/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { FC, HTMLAttributes } from 'react'
import { HistoryEntryContext } from './MaterialHistory'

export type HistoryEntryProps = {
  context?: HistoryEntryContext
  border?: { top?: boolean, bottom?: boolean } | boolean
} & HTMLAttributes<HTMLDivElement>

export const HistoryEntry: FC<HistoryEntryProps> = (props) => {
  const { border, children, context, ...rest} = props
  return (
    <div css={[historyEntryStyle, border && borderStyle(typeof border === 'boolean'? { bottom: true }: border)]} {...rest}>
      {children}
    </div>
  )

}

const historyEntryStyle = css`
  width: 100%;
  padding: 0.5em 0.5em 0.5em 0.7em;
  user-select: text;
`

const borderStyle = (border: { top?: boolean, bottom?: boolean }) => css`
  ${!!border?.top && borderTop}
  ${!!border?.bottom && borderBottom}
`

const borderBottom = css`
  border-bottom: 0.05em solid black;
  &:last-of-type {
    border-bottom: 0;
  }
`

const borderTop = css`
  border-top: 0.05em solid black;
  &:last-of-type {
    border-top: 0;
  }
`