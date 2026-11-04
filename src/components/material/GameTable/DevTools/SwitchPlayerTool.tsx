/** @jsxImportSource @emotion/react */
import { faRightLeft } from '@fortawesome/free-solid-svg-icons/faRightLeft'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FC } from 'react'
import { useGame } from '../../../../hooks/useGame'
import { usePlayerId, usePlayerIds } from '../../../../hooks/usePlayerId'
import {
  playerBtnActiveCss, playerBtnCss, playerGridCss,
  toolBtnCss, toolDescCss, toolIconCss, toolLabelCss
} from './devtools.css'

type SwitchPlayerToolProps = {
  exec: (action: () => void, msg: string) => void
  g: any
}

/**
 * Plain links to the page of each player: a click changes the player of this tab, a middle click opens that player in a
 * new tab. The link does the job, exec only tells when the game helper is missing. A tutorial is always played as its first
 * player: nothing to switch to.
 */
export const SwitchPlayerTool: FC<SwitchPlayerToolProps> = ({ exec, g }) => {
  const currentPlayer = usePlayerId()
  const players = usePlayerIds()
  const game = useGame<{ tutorial?: unknown }>()
  if (game?.tutorial) return null

  return (
    <div css={toolBtnCss}>
      <span css={toolIconCss}><FontAwesomeIcon icon={faRightLeft}/></span>
      <span css={toolLabelCss}>Switch Player</span>
      <span css={toolDescCss}>Click: this tab. Middle click: a new tab</span>
      <div css={playerGridCss}>
        {players.map(pid => (
          <a key={String(pid)} href={g?.playerUrl?.(pid)} onClick={() => exec(() => undefined, `Opened P${pid}`)}
            css={[playerBtnCss, pid === currentPlayer && playerBtnActiveCss]}>
            P{String(pid)}
          </a>
        ))}
        <a href={g?.playerUrl?.()} onClick={() => exec(() => undefined, 'Opened spectator')}
          css={[playerBtnCss, currentPlayer === undefined && playerBtnActiveCss]}>
          Spect
        </a>
      </div>
    </div>
  )
}
