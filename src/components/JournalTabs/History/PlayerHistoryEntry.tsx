/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { FC, HTMLAttributes } from 'react'
import { Avatar } from '../../Avatar'
import { HistoryEntry } from './HistoryEntry'
import { HistoryEntryContext } from './MaterialHistory'

type PlayerHistoryEntryProps = {
  context: HistoryEntryContext
  border?: boolean
  playerId?: number
} & HTMLAttributes<HTMLDivElement>

export const PlayerHistoryEntry: FC<PlayerHistoryEntryProps> = (props) => {
  const { border, playerId, children, context, ...rest } = props
  const player = playerId ?? context.action.playerId

  return (
    <HistoryEntry border={border}>
      <div css={container} {...rest}>
        {!!player && (
          <div>
            <Avatar css={avatarStyle} playerId={player}/>
          </div>
        )}
        <div>
          {children}
        </div>
      </div>
    </HistoryEntry>
  )
}

const container = css`
  display: flex;
  flex-direction: row;
  align-items: center
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