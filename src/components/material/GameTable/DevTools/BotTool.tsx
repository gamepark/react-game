/** @jsxImportSource @emotion/react */
import { FC, useContext, useState } from 'react'
import { gameContext } from '../../../GameProvider/GameContext'
import {
  activeIndicatorCss, toolBtnActiveCss, toolBtnCss, toolDescCss, toolIconCss, toolLabelCss
} from './devtools.css'

type BotToolProps = {
  exec: (action: () => void, msg: string) => void
  g: any
}

/* Reads the persisted `monkeyOpponents` flag from localStorage on
 * mount — the GameLocalAPI stores its whole localStore there, keyed
 * by the game name. That way the toggle opens in sync with whatever
 * state the bot is actually in (including reloads or toggles from
 * the console). Clicking delegates to `g.bot()` which is the
 * canonical alias that starts/stops the bots. */
export const BotTool: FC<BotToolProps> = ({ exec, g }) => {
  const gameName = useContext(gameContext)?.game
  const [botActive, setBotActive] = useState<boolean>(() => {
    if (!gameName || typeof window === 'undefined') return false
    try {
      const raw = window.localStorage.getItem(gameName)
      if (!raw) return false
      const parsed = JSON.parse(raw)
      return !!parsed?.monkeyOpponents
    } catch {
      return false
    }
  })

  return (
    <button css={[toolBtnCss, botActive && toolBtnActiveCss]}
      onClick={() => {
        const next = !botActive
        exec(() => g.bot(next), next ? 'Bots enabled' : 'Bots disabled')
        setBotActive(next)
      }}>
      <span css={toolIconCss}>{'\u2699'}</span>
      <span css={toolLabelCss}>{botActive ? 'Disable Bots' : 'Enable Bots'}</span>
      <span css={toolDescCss}>{botActive ? 'Stop auto-play' : 'Auto-play all moves'}</span>
      {botActive && <span css={activeIndicatorCss} />}
    </button>
  )
}
