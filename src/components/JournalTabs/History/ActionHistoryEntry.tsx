/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { FC } from 'react'
import { Picture } from '../../Picture'
import { HistoryEntry } from './HistoryEntry'
import { PlayerHistoryEntry, PlayerHistoryEntryProps } from './PlayerHistoryEntry'

export type ActionHistoryEntryProps = {
  consequence?: boolean
  noPlayer?: boolean
  depth?: number
  picture?: string
  pictureCss?: any
  getColor?: (playerId: number) => string
  playerId?: number
} & PlayerHistoryEntryProps


export const ActionHistoryEntry: FC<ActionHistoryEntryProps> = (props) => {
  const { noPlayer, playerId, consequence, getColor, depth, picture, pictureCss, context, children, ...rest } = props
  const noPlayerEntry = consequence || !!noPlayer
  const player = playerId ?? context.action.playerId

  if (noPlayerEntry) {
    return (
      <HistoryEntry context={context} css={playerId && color(getColor?.(playerId) ?? 'white')} {...rest}>
        <ActionHistoryContent {...props} />
      </HistoryEntry>
    )
  }

  if (!player) return null
  return (
    <PlayerHistoryEntry context={context} playerId={player} css={[color(getColor?.(player) ?? 'white')]} {...rest}>
      <ActionHistoryContent {...props} />
    </PlayerHistoryEntry>
  )
}

const ActionHistoryContent: FC<ActionHistoryEntryProps> = (props) => {
  const { consequence, depth, picture, pictureCss, children } = props
  return (
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