/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react'
import { FC, PropsWithChildren, useCallback, useContext, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { gameContext } from '../../../GameProvider/GameContext'
import { GamePanel } from './GamePanel'
import { SaveLoadPanel } from './SaveLoadPanel'
import { ExportPanel } from './ExportPanel'

export type GameOption = {
  key: string
  label: string
  type: 'boolean'
}

type MenuId = 'game' | 'save' | 'export' | 'custom'

const menuItems: { id: MenuId; icon: string; label: string }[] = [
  { id: 'game', icon: '\u2699', label: 'Game' },
  { id: 'save', icon: '\u2B73', label: 'Save / Load' },
  { id: 'export', icon: '\u2398', label: 'Export' },
]

type DevToolsHubProps = PropsWithChildren<{
  fabBottom?: string
  gameOptions?: GameOption[]
}>

export const DevToolsHub: FC<DevToolsHubProps> = ({ children, fabBottom, gameOptions }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState<MenuId | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const gameName = useContext(gameContext)?.game ?? 'unknown'

  const doFlash = useCallback((msg: string) => {
    if (flashTimeout.current) clearTimeout(flashTimeout.current)
    setFlash(msg)
    flashTimeout.current = setTimeout(() => setFlash(null), 1500)
  }, [])

  const g = typeof window !== 'undefined' ? (window as any).game : undefined

  const exec = useCallback((action: () => void, successMsg: string) => {
    if (!g) { doFlash('game helper not available'); return }
    action()
    doFlash(successMsg)
  }, [g, doFlash])

  const allMenuItems = children
    ? [...menuItems, { id: 'custom' as MenuId, icon: '\u2726', label: 'Custom' }]
    : menuItems

  const root = document.getElementById('root')
  if (!root) return null

  return createPortal(
    <>
      <button css={fabCss} onClick={() => { setIsOpen(o => !o); if (isOpen) setActiveMenu(null) }} data-open={isOpen}
        style={fabBottom ? { bottom: fabBottom } : undefined}>
        <svg css={logoCss} viewBox="0 0 46 46" data-open={isOpen}>
          <circle cx="11" cy="11" r="7" />
          <circle cx="35" cy="11" r="7" />
          <circle cx="11" cy="35" r="7" />
          <circle cx="35" cy="35" r="7" />
        </svg>
      </button>

      {isOpen && (
        <>
        <div css={backdropCss} onClick={() => { setIsOpen(false); setActiveMenu(null) }} />
        <div css={hubContainerCss} style={fabBottom ? { bottom: `calc(${fabBottom} + 48px)` } : undefined}>
          {/* Main menu */}
          <div css={mainMenuCss}>
            <div css={panelHeaderCss}>
              <svg css={headerLogoCss} viewBox="0 0 46 46">
                <circle cx="11" cy="11" r="7" />
                <circle cx="35" cy="11" r="7" />
                <circle cx="11" cy="35" r="7" />
                <circle cx="35" cy="35" r="7" />
              </svg>
              <span css={panelTitleCss}>Dev Tools</span>
              <span css={panelBadgeCss}>GP</span>
            </div>
            <div css={menuListCss}>
              {allMenuItems.map(item => (
                <button
                  key={item.id}
                  css={[menuItemCss, activeMenu === item.id && menuItemActiveCss]}
                  onClick={() => setActiveMenu(prev => prev === item.id ? null : item.id)}
                  onMouseEnter={() => setActiveMenu(item.id)}
                >
                  <span css={menuItemIconCss}>{item.icon}</span>
                  <span css={menuItemLabelCss}>{item.label}</span>
                  <span css={menuChevronCss}>{'\u25B8'}</span>
                </button>
              ))}
            </div>
            {flash && <div css={flashCss} key={flash}>{flash}</div>}
          </div>

          {/* Sub-panel */}
          {activeMenu && (
            <div css={subPanelCss}>
              <div css={subPanelHeaderCss}>
                <span css={subPanelTitleCss}>
                  {allMenuItems.find(m => m.id === activeMenu)?.label}
                </span>
              </div>
              <div css={subPanelContentCss}>
                {activeMenu === 'game' && <GamePanel exec={exec} g={g} gameOptions={gameOptions} />}
                {activeMenu === 'save' && <SaveLoadPanel gameName={gameName} doFlash={doFlash} />}
                {activeMenu === 'export' && <ExportPanel gameName={gameName} doFlash={doFlash} />}
                {activeMenu === 'custom' && children}
              </div>
            </div>
          )}
        </div>
        </>
      )}
    </>,
    root
  )
}

// ── Styles ──

const GP_PRIMARY = '#28B8CE'
const GP_DARK = '#002448'
const GP_SURFACE = '#0a1929'
const GP_ACCENT = '#9fe2f7'

const fabPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(40, 184, 206, 0.25); }
  50% { box-shadow: 0 0 0 5px rgba(40, 184, 206, 0); }
`

const fabCss = css`
  position: fixed; bottom: 16px; left: 16px; z-index: 900;
  width: 40px; height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(40, 184, 206, 0.4);
  background: linear-gradient(145deg, ${GP_SURFACE}, ${GP_DARK});
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  padding: 0;
  animation: ${fabPulse} 3s ease-in-out infinite;
  transition: all 0.2s;
  &:hover { border-color: rgba(40, 184, 206, 0.7); animation: none; }
  &[data-open="true"] { animation: none; background: ${GP_PRIMARY}; border-color: ${GP_PRIMARY}; }
`

const logoCss = css`
  width: 22px; height: 22px;
  fill: ${GP_PRIMARY};
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  &[data-open="true"] { fill: ${GP_DARK}; transform: rotate(90deg); }
`

const backdropCss = css`
  position: fixed; inset: 0; z-index: 899;
`

const hubContainerCss = css`
  position: fixed; bottom: 64px; left: 16px; z-index: 900;
  display: flex; align-items: flex-end; gap: 6px;
`

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(8px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`

const slideRight = keyframes`
  from { opacity: 0; transform: translateX(-8px) scale(0.97); }
  to { opacity: 1; transform: translateX(0) scale(1); }
`

const panelBg = `linear-gradient(170deg, #0f2035 0%, ${GP_SURFACE} 100%)`
const panelShadow = `0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.3), inset 0 1px 0 rgba(159,226,247,0.05)`

const mainMenuCss = css`
  position: relative; width: 200px;
  background: ${panelBg};
  border: 1px solid rgba(40, 184, 206, 0.25);
  border-radius: 12px;
  box-shadow: ${panelShadow};
  animation: ${slideUp} 0.2s ease-out;
  font-family: 'Mulish', sans-serif;
  overflow: hidden;
`

const subPanelCss = css`
  width: 320px; max-height: calc(100vh - 80px);
  display: flex; flex-direction: column;
  background: ${panelBg};
  border: 1px solid rgba(40, 184, 206, 0.25);
  border-radius: 12px;
  box-shadow: ${panelShadow};
  animation: ${slideRight} 0.15s ease-out;
  font-family: 'Mulish', sans-serif;
  overflow: hidden;
`

const subPanelHeaderCss = css`
  padding: 10px 16px;
  border-bottom: 1px solid rgba(40, 184, 206, 0.15);
  background: rgba(40, 184, 206, 0.04);
  flex-shrink: 0;
`

const subPanelTitleCss = css`
  font-size: 12px; font-weight: 800; color: #5a8a98;
  text-transform: uppercase; letter-spacing: 0.1em;
`

const subPanelContentCss = css`
  display: flex; flex-direction: column;
  padding: 6px; gap: 2px;
  overflow-y: auto; flex: 1; min-height: 0;
`

const panelHeaderCss = css`
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(40, 184, 206, 0.15);
  background: rgba(40, 184, 206, 0.04);
`

const headerLogoCss = css`
  width: 18px; height: 18px; fill: ${GP_ACCENT}; flex-shrink: 0;
`

const panelTitleCss = css`
  font-size: 14px; font-weight: 800; color: #e0f0f4;
  text-transform: uppercase; letter-spacing: 0.08em; flex: 1;
`

const panelBadgeCss = css`
  font-size: 9px; font-weight: 800;
  padding: 2px 6px; border-radius: 4px;
  background: rgba(40, 184, 206, 0.15);
  color: ${GP_PRIMARY}; letter-spacing: 0.1em;
`

const menuListCss = css`
  display: flex; flex-direction: column; padding: 6px; gap: 2px;
`

const menuItemCss = css`
  position: relative;
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border: none; border-radius: 8px;
  background: transparent;
  cursor: pointer; text-align: left;
  transition: background 0.15s;
  font-family: inherit;
  &:hover { background: rgba(40, 184, 206, 0.08); }
`

const menuItemActiveCss = css`
  background: rgba(40, 184, 206, 0.12);
  &::before {
    content: ''; position: absolute; left: 0; top: 50%;
    transform: translateY(-50%);
    width: 3px; height: 18px;
    border-radius: 0 3px 3px 0;
    background: ${GP_PRIMARY};
  }
`

const menuItemIconCss = css`
  font-size: 15px; color: ${GP_PRIMARY};
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px;
  background: rgba(40, 184, 206, 0.08); flex-shrink: 0;
`

const menuItemLabelCss = css`
  font-size: 13px; font-weight: 700; color: #e0f0f4; flex: 1;
`

const menuChevronCss = css`
  font-size: 10px; color: #3a6070;
`

const flashFade = keyframes`
  0% { opacity: 0; transform: translateY(6px); }
  15% { opacity: 1; transform: translateY(0); }
  85% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-6px); }
`

const flashCss = css`
  position: absolute; bottom: 100%; left: 0; right: 0;
  margin-bottom: 8px; padding: 6px 14px;
  font-size: 12px; font-weight: 700; color: ${GP_PRIMARY};
  text-align: center;
  background: linear-gradient(145deg, ${GP_SURFACE}, ${GP_DARK});
  border: 1px solid rgba(40, 184, 206, 0.3);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  white-space: nowrap; pointer-events: none;
  animation: ${flashFade} 1.5s ease-out forwards;
`
