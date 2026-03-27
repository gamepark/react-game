import { css, Interpolation, Theme } from '@emotion/react'
import { FC, HTMLAttributes } from 'react'
import { SetupLogDescription } from '../../Log'

type SetupLogItemProps = {
  log: SetupLogDescription
  game: any
  index: number
  customEntryCss?: Interpolation<Theme>
} & HTMLAttributes<HTMLDivElement>

export const SetupLogItem: FC<SetupLogItemProps> = ({ log, game, index, customEntryCss, ...rest }) => {
  return (
    <div {...rest}>
      <div css={[entryCss, customEntryCss, log.css]}>
        <div>
          <log.Component game={game} index={index}/>
        </div>
      </div>
    </div>
  )
}

const entryCss = css`
  width: 100%;
  background-color: rgba(0, 0, 0, 0.7);
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
  white-space: pre-wrap;

  img, picture {
    vertical-align: middle;
  }
`
