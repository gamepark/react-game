/** @jsxImportSource @emotion/react */
import { FC, useState } from 'react'
import {
  activeIndicatorCss, toolBtnActiveCss, toolBtnCss, toolDescCss, toolIconCss, toolLabelCss
} from './devtools.css'

type BotToolProps = {
  exec: (action: () => void, msg: string) => void
  g: any
}

export const BotTool: FC<BotToolProps> = ({ exec, g }) => {
  const [botActive, setBotActive] = useState(false)

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
