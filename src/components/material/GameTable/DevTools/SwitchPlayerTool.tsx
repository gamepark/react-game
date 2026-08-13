/** @jsxImportSource @emotion/react */
import { FC } from 'react'
import { usePlayerId, usePlayerIds } from '../../../../hooks/usePlayerId'
import {
  inlineRowCss, playerBtnActiveCss, playerBtnCss,
  toolBtnCss, toolDescCss, toolIconCss, toolLabelCss
} from './devtools.css'

type SwitchPlayerToolProps = {
  exec: (action: () => void, msg: string) => void
  g: any
}

export const SwitchPlayerTool: FC<SwitchPlayerToolProps> = ({ exec, g }) => {
  const currentPlayer = usePlayerId()
  const players = usePlayerIds()

  return (
    <div css={toolBtnCss}>
      <span css={toolIconCss}>{'\u2194'}</span>
      <span css={toolLabelCss}>Switch Player</span>
      <span css={toolDescCss}>Open the tab of another player</span>
      <div css={inlineRowCss} onClick={e => e.stopPropagation()}>
        {players.map(pid => (
          <button key={String(pid)}
            css={[playerBtnCss, pid === currentPlayer && playerBtnActiveCss]}
            onClick={() => exec(() => g.openPlayer(pid), `Opened P${pid}`)}>
            P{String(pid)}
          </button>
        ))}
        <button
          css={[playerBtnCss, currentPlayer === undefined && playerBtnActiveCss]}
          onClick={() => exec(() => g.openPlayer(), 'Opened spectator')}>
          Spect
        </button>
      </div>
    </div>
  )
}
