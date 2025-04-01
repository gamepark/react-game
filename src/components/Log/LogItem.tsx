/** @jsxImportSource @emotion/react */
import { css, Interpolation, Theme } from '@emotion/react'
import { FC, HTMLAttributes } from 'react'
import { MoveHistory } from '../../hooks/useFlatHistory'
import { Avatar } from '../Avatar'

type HistoryItemProps = {
  history: MoveHistory
  customEntryCss?: Interpolation<Theme>
  disableCustomCss?: boolean
} & HTMLAttributes<HTMLDivElement>

export const LogItem: FC<HistoryItemProps> = ({ history, disableCustomCss, customEntryCss, ...rest }) => {
  const depth = history.depth ?? 0
  return (
    <div { ...rest }>
      <div css={[entryCss, customEntryCss, !disableCustomCss && history.extraCss]}>
        {history.player !== undefined && <div><Avatar css={avatarCss} playerId={history.player}/></div>}
        {depth > 0 && <div css={depthIconCss(depth)}>⤷</div>}
        <div>
          <history.Component move={history.move} context={history} />
        </div>
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


const depthIconCss = (depth: number) => css`
  font-size: 1.5em;
  margin-right: 0.4em;
  margin-left: ${0.5 + (1.5 * (depth - 1))}em;
  margin-top: -0.2em;
`
