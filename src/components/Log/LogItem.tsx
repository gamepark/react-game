/** @jsxImportSource @emotion/react */
import { css, Interpolation, Theme } from '@emotion/react'
import { FC, HTMLAttributes } from 'react'
import { MoveHistory } from '../../hooks/useFlatHistory'
import { Avatar } from '../Avatar'

type HistoryItemProps = {
  history: MoveHistory
  customEntryCss?: Interpolation<Theme>
} & HTMLAttributes<HTMLDivElement>

export const LogItem: FC<HistoryItemProps> = ({ history, customEntryCss, ...rest }) => {
  return (
    <div { ...rest }>
      <div css={[entryCss, customEntryCss, history.extraCss]}>
        {history.player !== undefined && <div><Avatar css={avatarCss} playerId={history.player}/></div>}
        <history.Component move={history.move} context={history} />
      </div>
    </div>
  )


}

const entryCss = css`
    width: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    border-radius: 1em;
    margin-bottom: 0.5em;
    min-height: 1em;
    padding-left: 1em;
    margin-left: 0.05em;
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

const avatarCss = css`
  position: relative;
  left: 0;
  border-radius: 100%;
  height: 2.5em;
  width: 2.5em;
  margin-right: 1em;
  color: black;
  z-index: 1;
`
