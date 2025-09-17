import { css } from '@emotion/react'
import { HTMLAttributes } from 'react'
import { Avatar } from '../../Avatar'

export type HistoryEntryProps<P extends number = number> = {
  player?: P
  depth?: number
  backgroundColor?: string
  borderTop?: boolean
  borderBottom?: boolean
} & HTMLAttributes<HTMLDivElement>

export const HistoryEntry = <P extends number = number>({ player, depth = 0, backgroundColor, borderTop, borderBottom, children, ...props }: HistoryEntryProps<P>) => {
  return (
    <div css={[historyEntryCss, backgroundColor && backgroundColorCss(backgroundColor), borderTop && borderTopCss, borderBottom && borderBottomCss]} {...props}>
      {player !== undefined && <div><Avatar css={avatarCss} playerId={player}/></div>}
      {depth > 0 && <div css={depthIconCss(depth)}>⤷</div>}
      <div css={css`flex: 1;`}>{children}</div>
    </div>
  )
}

const historyEntryCss = css`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.5em 0.5em 0.5em 0.7em;
  user-select: text;
`

const backgroundColorCss = (color: string) => css`
  background-color: ${color};
`

const borderTopCss = css`
  border-top: 0.05em solid black;
`

const borderBottomCss = css`
  border-bottom: 0.05em solid black;
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