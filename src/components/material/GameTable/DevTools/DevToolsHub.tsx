/** @jsxImportSource @emotion/react */
import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight'
import { faDice } from '@fortawesome/free-solid-svg-icons/faDice'
import { faFileExport } from '@fortawesome/free-solid-svg-icons/faFileExport'
import { faFloppyDisk } from '@fortawesome/free-solid-svg-icons/faFloppyDisk'
import { faMoon } from '@fortawesome/free-solid-svg-icons/faMoon'
import { faStar } from '@fortawesome/free-solid-svg-icons/faStar'
import { faSun } from '@fortawesome/free-solid-svg-icons/faSun'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { CSSProperties, FC, PropsWithChildren, useCallback, useContext, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { gameContext } from '../../../GameProvider/GameContext'
import {
  anchorCss, backdropCss, dayThemeCss, fabCss, flashCss, headerLogoCss, hubCss, logoCss, mainMenuCss, menuChevronCss, menuItemActiveCss,
  menuItemCss, menuItemLabelCss, menuListCss, nightThemeCss, panelHeaderCss, panelTitleCss, subPanelCss, themeBtnCss
} from './devtools.css'
import { ExportPanel } from './ExportPanel'
import { GamePanel } from './GamePanel'
import { useReloadOnReplay } from './replayGame'
import { SaveLoadPanel } from './SaveLoadPanel'
import { useDevToolsTheme } from './useDevToolsTheme'

export type GameOption = {
  key: string
  label: string
  type: 'boolean'
}

type MenuId = 'game' | 'save' | 'export' | 'custom'

type DevToolsHubProps = PropsWithChildren<{
  fabBottom?: string
  gameOptions?: GameOption[]
}>

const Logo: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 46 46" aria-hidden="true">
    <circle cx="11" cy="11" r="7"/>
    <circle cx="35" cy="11" r="7"/>
    <circle cx="11" cy="35" r="7"/>
    <circle cx="35" cy="35" r="7"/>
  </svg>
)

export const DevToolsHub: FC<DevToolsHubProps> = ({ children, fabBottom = '1em', gameOptions }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState<MenuId | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { theme, toggleTheme } = useDevToolsTheme()

  const gameName = useContext(gameContext)?.game ?? 'unknown'
  useReloadOnReplay(gameName)

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

  const menuItems = [
    { id: 'game' as const, icon: faDice, label: 'Game' },
    { id: 'save' as const, icon: faFloppyDisk, label: 'Save / Load' },
    { id: 'export' as const, icon: faFileExport, label: 'Export' },
    ...(children ? [{ id: 'custom' as const, icon: faStar, label: 'Custom' }] : [])
  ]
  const activeItem = menuItems.find(item => item.id === activeMenu)

  const close = () => {
    setIsOpen(false)
    setActiveMenu(null)
  }

  const root = document.getElementById('root')
  if (!root) return null

  return createPortal(
    <>
      {isOpen && <div css={backdropCss} onClick={close}/>}
      <div css={[anchorCss, theme === 'day' ? dayThemeCss : nightThemeCss]} style={{ '--dt-bottom': fabBottom } as CSSProperties}>
        {isOpen && (
          <div css={hubCss}>
            {/* Main menu */}
            <div css={mainMenuCss}>
              {flash && <div css={flashCss} key={flash} role="status">{flash}</div>}
              <div css={panelHeaderCss}>
                <Logo css={headerLogoCss}/>
                <span css={panelTitleCss}>Dev Tools</span>
                <button css={themeBtnCss} onClick={toggleTheme}
                  title={theme === 'day' ? 'Switch to night' : 'Switch to day'} aria-label={theme === 'day' ? 'Switch to night' : 'Switch to day'}>
                  <FontAwesomeIcon icon={theme === 'day' ? faMoon : faSun}/>
                </button>
              </div>
              <div css={menuListCss}>
                {menuItems.map(item => (
                  <button
                    key={item.id}
                    css={[menuItemCss, activeMenu === item.id && menuItemActiveCss]}
                    aria-expanded={activeMenu === item.id}
                    onClick={() => setActiveMenu(prev => prev === item.id ? null : item.id)}
                    onMouseEnter={() => setActiveMenu(item.id)}
                  >
                    <FontAwesomeIcon icon={item.icon} fixedWidth/>
                    <span css={menuItemLabelCss}>{item.label}</span>
                    <FontAwesomeIcon icon={faChevronRight} css={menuChevronCss}/>
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-panel */}
            {activeMenu && (
              <section css={subPanelCss} aria-label={activeItem?.label}>
                {activeMenu === 'game' && <GamePanel exec={exec} g={g} gameOptions={gameOptions}/>}
                {activeMenu === 'save' && <SaveLoadPanel gameName={gameName} doFlash={doFlash}/>}
                {activeMenu === 'export' && <ExportPanel gameName={gameName} doFlash={doFlash}/>}
                {activeMenu === 'custom' && children}
              </section>
            )}
          </div>
        )}
        <button css={fabCss} aria-label={isOpen ? 'Close dev tools' : 'Open dev tools'} aria-expanded={isOpen}
          onClick={() => isOpen ? close() : setIsOpen(true)}>
          <Logo css={logoCss}/>
        </button>
      </div>
    </>,
    root
  )
}
