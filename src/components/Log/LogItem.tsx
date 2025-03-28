/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { FC, HTMLAttributes } from 'react'
import { MoveHistory } from '../../hooks/useFlatHistory'

type HistoryItemProps = {
  history: MoveHistory
} & HTMLAttributes<HTMLDivElement>

export const LogItem: FC<HistoryItemProps> = ({ history, ...rest }) => {
  return (
    <div { ...rest }>
      <div css={entryCss}>
        <history.Component move={history.move} context={history} />
      </div>
    </div>
  )


}

const entryCss = css`
    width: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 1em;
    margin-bottom: 0.5em;
    min-height: 1em;
    padding-left: 1em;
    margin-top: 0.05em;
    padding-top: 0.5em;
    padding-bottom: 0.5em;
    pointer-events: none;
    display: flex;
    align-items: center;
    font-size: 2em;
    
    > picture {
        display: flex;
        margin-left: 0.5em;
        margin-right: 0.5em;
    }
`
