/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { FC, memo } from 'react'

export const HistoryEntry: FC = memo(({ children }) => {
  return (
    <div css={historyEntryStyle}>
      {children}
    </div>
  )

})

const historyEntryStyle = css`
  width: 100%;
  padding: 0.7em 0.5em 0.7em 0.7em;
  font-size: 0.7em;
  border-bottom: 0.05em solid lightgray;
  user-select: text;
  
  &:last-of-type {
    border-bottom: 0;
  }
`