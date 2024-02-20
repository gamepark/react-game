/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { FC } from 'react'
import { Avatar } from '../../Avatar'
import { HistoryEntry, HistoryEntryProps } from './HistoryEntry'
import { HistoryEntryContext } from './MaterialHistory'

export type PlayerHistoryEntryProps = {
  context: HistoryEntryContext
  playerId?: number
} & HistoryEntryProps

export const PlayerHistoryEntry: FC<PlayerHistoryEntryProps> = (props) => {
  const { border, playerId, children, context, ...rest } = props
  const player = playerId

  return (
    <HistoryEntry border={border} {...rest}>
      <div css={container}>
        {!!player && (
          <div>
            <Avatar css={avatarStyle} playerId={player}/>
          </div>
        )}
        <div css={growth}>
          {children}
        </div>
      </div>
    </HistoryEntry>
  )
}

const container = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 1;
`

const growth = css`
  flex-grow: 1;
`

const avatarStyle = css`
  position: relative;
  left: 0;
  border-radius: 100%;
  height: 2.5em;
  width: 2.5em;
  margin-right: 1em;
  color: black;
  z-index: 1;
`