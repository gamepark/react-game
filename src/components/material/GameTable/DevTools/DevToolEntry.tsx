/** @jsxImportSource @emotion/react */
import { FC, ReactNode } from 'react'
import { toolBtnCss, toolDescCss, toolIconCss, toolLabelCss } from './devtools.css'

export const devToolBtnCss = toolBtnCss
export const devToolIconCss = toolIconCss
export const devToolLabelCss = toolLabelCss
export const devToolDescCss = toolDescCss

/**
 * A single entry in the DevToolsHub panel.
 * Use this instead of raw `<button>` when adding custom tools via `children`.
 *
 * @example
 * <DevToolsHub>
 *   <DevToolEntry icon="✦" label="Card Viewer" desc="Browse agents" onClick={() => setShowCards(true)} />
 * </DevToolsHub>
 */
export const DevToolEntry: FC<{
  icon: ReactNode
  label: string
  desc?: string
  onClick?: () => void
}> = ({ icon, label, desc, onClick }) => (
  <button css={devToolBtnCss} onClick={onClick}>
    <span css={devToolIconCss}>{icon}</span>
    <span css={devToolLabelCss}>{label}</span>
    {desc && <span css={devToolDescCss}>{desc}</span>}
  </button>
)
