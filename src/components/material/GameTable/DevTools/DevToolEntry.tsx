/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react'
import { FC, ReactNode } from 'react'

const GP_PRIMARY = '#28B8CE'

const toolReveal = keyframes`
  from { opacity: 0; transform: translateX(-0.375em); }
  to { opacity: 1; transform: translateX(0); }
`

export const devToolBtnCss = css`
  position: relative;
  display: grid;
  grid-template-columns: 1.75em 1fr;
  grid-template-rows: auto auto;
  align-items: center;
  gap: 0 0.625em;
  padding: 0.625em 0.75em;
  border: none;
  border-radius: 0.5em;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  animation: ${toolReveal} 0.25s ease-out backwards;
  font-family: inherit;
  &:hover { background: rgba(40, 184, 206, 0.08); }
  &:active { background: rgba(40, 184, 206, 0.14); }
`

export const devToolIconCss = css`
  grid-row: 1 / -1;
  color: ${GP_PRIMARY};
  display: flex; align-items: center; justify-content: center;
  width: 1.75em; height: 1.75em;
  border-radius: 0.375em;
  background: rgba(40, 184, 206, 0.08);
`

export const devToolLabelCss = css`
  font-weight: 700; color: #e0f0f4; line-height: 1.2;
`

export const devToolDescCss = css`
  color: #5a8a98; line-height: 1.2;
`

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
