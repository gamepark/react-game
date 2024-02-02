/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { HistoryEntryOptions } from '@gamepark/react-client'
import { FC, HTMLAttributes } from 'react'
import { Avatar } from '../../Avatar'

type PlayerActionHistoryProps = {
  options: HistoryEntryOptions
  playerId?: number
} & HTMLAttributes<HTMLDivElement>

export const PlayerActionHistory: FC<PlayerActionHistoryProps> = (props) => {
  const { playerId, children, options, ...rest } = props
  const player = playerId ?? options.action.playerId

  return (

    <div css={container} {...rest}>
      {!!player && (
        <div>
          <Avatar css={avatarStyle} playerId={playerId}/>
        </div>
      )}
      <div>
        {children}
      </div>
    </div>
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