/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { FC, HTMLAttributes } from 'react'

export type HistoryEntryProps = {
  border?: boolean
} & HTMLAttributes<HTMLDivElement>

export const HistoryEntry: FC<HistoryEntryProps> = ({ border, children, ...props }) => {
  return (
    <div css={[historyEntryStyle, border && borderBottom]} {...props}>
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