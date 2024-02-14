/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { FC } from 'react'
import { Picture } from '../../Picture'
import { HistoryEntry } from './HistoryEntry'
import { HistoryEntryContext } from './MaterialHistory'
import { PlayerHistoryEntry } from './PlayerHistoryEntry'

export type ActionHistoryEntryProps = {
  consequence?: boolean
  depth?: number
  picture?: string
  pictureCss?: any
  getColor?: (playerId: number) => string
  context: HistoryEntryContext
}


export const ActionHistoryEntry: FC<ActionHistoryEntryProps> = (props) => {
  const { consequence, getColor, depth, picture, pictureCss, context, children } = props
  const Component = consequence? HistoryEntry: PlayerHistoryEntry
  return (
    <Component context={context} css={[color(getColor?.(context.action.playerId) ?? 'white')]}>
      <div css={flex}>
        {consequence && (
          <div css={consequenceIcon(depth)}>⤷</div>
        )}
        <div css={growth}>
          {children}
        </div>
        {picture && (
          <div css={actionPicture}>
            <Picture css={[pictureStyle, pictureCss]} src={picture}/>
          </div>
        )}
      </div>
    </Component>
  )
}

const flex = css`
  display: flex;
  width: 100%;
  align-items: center;
`

const growth = css`
  flex: 1;
`

const pictureStyle = css`
  height: 2.2em; 
  border-radius: 0.5em; 
  border: 0.1em solid black
`

const color = (color: string) => css`
  background-color: ${color};
`

const actionPicture = css`
  padding-left: 0.3em;
  border-radius: 0.5em;
`

const consequenceIcon = (times: number = 1) => css`
  font-size: 1.5em;
  margin-right: 0.4em;
  margin-left: ${0.5 + (1.5 * (times - 1))}em;
  margin-top: -0.2em;
`