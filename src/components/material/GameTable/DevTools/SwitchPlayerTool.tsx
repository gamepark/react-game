/** @jsxImportSource @emotion/react */
import { FC } from 'react'
import { useGame } from '../../../../hooks/useGame'
import { usePlayerId, usePlayerIds } from '../../../../hooks/usePlayerId'
import {
  inlineRowCss, playerBtnActiveCss, playerBtnCss,
  toolBtnCss, toolDescCss, toolIconCss, toolLabelCss
} from './devtools.css'

type SwitchPlayerToolProps = {
  g: any
}

/**
 * Plain links to the page of each player: a click changes the player of this tab, a middle click opens that player in a
 * new tab. A tutorial is always played as its first player: nothing to switch to.
 */
export const SwitchPlayerTool: FC<SwitchPlayerToolProps> = ({ g }) => {
  const currentPlayer = usePlayerId()
  const players = usePlayerIds()
  const game = useGame<{ tutorial?: unknown }>()
  if (game?.tutorial) return null

  return (
    <div css={toolBtnCss}>
      <span css={toolIconCss}>{'↔'}</span>
      <span css={toolLabelCss}>Switch Player</span>
      <span css={toolDescCss}>Click: this tab. Middle click: a new tab</span>
      <div css={inlineRowCss} onClick={e => e.stopPropagation()}>
        {players.map(pid => (
          <a key={String(pid)} href={g.playerUrl(pid)}
            css={[playerBtnCss, pid === currentPlayer && playerBtnActiveCss]}>
            P{String(pid)}
          </a>
        ))}
        <a href={g.playerUrl()}
          css={[playerBtnCss, currentPlayer === undefined && playerBtnActiveCss]}>
          Spect
        </a>
      </div>
    </div>
  )
}
