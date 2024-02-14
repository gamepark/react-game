/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { FC, HTMLAttributes } from 'react'
import { HistoryEntryContext } from './MaterialHistory'

export type HistoryEntryProps = {
  context?: HistoryEntryContext
  border?: boolean
} & HTMLAttributes<HTMLDivElement>

export const HistoryEntry: FC<HistoryEntryProps> = (props) => {
  const { border, children, context, ...rest} = props
  return (
    <div css={[historyEntryStyle, border && borderBottom]} {...rest}>
      {children}
    </div>
  )

}

const historyEntryStyle = css`
  width: 100%;
  padding: 0.5em 0.5em 0.5em 0.7em;
  user-select: text;
`

const borderBottom = css`
  border-bottom: 0.05em solid black;
  &:last-of-type {
    border-bottom: 0;
  }
`