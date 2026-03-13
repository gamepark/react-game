/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react'
import { FC, PropsWithChildren, ReactNode, useCallback, useContext, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useGame } from '../../../hooks/useGame'
import { usePlayerId, usePlayerIds } from '../../../hooks/usePlayerId'
import { gameContext } from '../../GameProvider/GameContext'

const GP_PRIMARY = '#28B8CE'
const GP_DARK = '#002448'
const GP_SURFACE = '#0a1929'
const GP_ACCENT = '#9fe2f7'

// ═══════════════════════════════════════
//  JSON syntax highlighting (pure React)
// ═══════════════════════════════════════

const highlightJson = (json: string): ReactNode[] => {
  const parts: ReactNode[] = []
  // Regex to match JSON tokens
  const tokenRegex = /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(true|false|null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],])/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(json)) !== null) {
    // Add whitespace between tokens
    if (match.index > lastIndex) {
      parts.push(json.slice(lastIndex, match.index))
    }
    const [full, key, str, bool, num, punct] = match
    if (key) {
      // key: "xxx":
      const colonIdx = key.lastIndexOf(':')
      parts.push(<span key={`k${match.index}`} css={jsonKeyCss}>{key.slice(0, colonIdx)}</span>)
      parts.push(key.slice(colonIdx))
    } else if (str) {
      parts.push(<span key={`s${match.index}`} css={jsonStringCss}>{full}</span>)
    } else if (bool) {
      parts.push(<span key={`b${match.index}`} css={jsonBoolCss}>{full}</span>)
    } else if (num) {
      parts.push(<span key={`n${match.index}`} css={jsonNumCss}>{full}</span>)
    } else if (punct) {
      parts.push(<span key={`p${match.index}`} css={jsonPunctCss}>{full}</span>)
    }
    lastIndex = match.index + full.length
  }
  if (lastIndex < json.length) {
    parts.push(json.slice(lastIndex))
  }
  return parts
}

export type GameOption = {
  key: string
  label: string
  type: 'boolean'
}

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

// ═══════════════════════════════════════
//  Save/Load helpers
// ═══════════════════════════════════════

const SAVE_PREFIX = ':save:'

const getSaveKeys = (gameName: string): string[] => {
  const prefix = gameName + SAVE_PREFIX
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(prefix)) keys.push(key)
  }
  return keys.sort()
}

const getSaveLabel = (key: string, gameName: string): string => {
  return key.slice((gameName + SAVE_PREFIX).length)
}

// ═══════════════════════════════════════
//  Menu categories
// ═══════════════════════════════════════

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
  const [newGamePlayers, setNewGamePlayers] = useState(2)
  const [options, setOptions] = useState<Record<string, boolean>>({})
  const [undoCount, setUndoCount] = useState(1)
  const [botActive, setBotActive] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const [saveLabel, setSaveLabel] = useState('')
  const [importText, setImportText] = useState('')
  const [pasteError, setPasteError] = useState<string | null>(null)
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [saveRefresh, setSaveRefresh] = useState(0)
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const gameState = useGame()
  const currentPlayer = usePlayerId()
  const players = usePlayerIds()
  const gameName = useContext(gameContext)?.game ?? 'unknown'

  const doFlash = useCallback((msg: string) => {
    if (flashTimeout.current) clearTimeout(flashTimeout.current)
    setFlash(msg)
    flashTimeout.current = setTimeout(() => setFlash(null), 1500)
  }, [])

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      doFlash(`${label} copied!`)
    } catch {
      doFlash('Copy failed')
    }
  }, [doFlash])

  const g = typeof window !== 'undefined' ? (window as any).game : undefined

  const exec = useCallback((action: () => void, successMsg: string) => {
    if (!g) {
      doFlash('game helper not available')
      return
    }
    action()
    doFlash(successMsg)
  }, [g, doFlash])

  // Save/Load handlers
  const saveKeys = getSaveKeys(gameName)
  void saveRefresh // force re-read

  const handleSave = useCallback(() => {
    if (!gameState) { doFlash('No game state'); return }
    const label = saveLabel.trim() || new Date().toLocaleTimeString()
    const key = gameName + SAVE_PREFIX + label
    localStorage.setItem(key, JSON.stringify(gameState))
    setSaveLabel('')
    setSaveRefresh(n => n + 1)
    doFlash(`Saved: ${label}`)
  }, [gameState, saveLabel, gameName, doFlash])

  const handleLoad = useCallback((key: string) => {
    const raw = localStorage.getItem(key)
    if (!raw) { doFlash('Save not found'); return }
    try {
      const state = JSON.parse(raw)
      if (g) {
        g.new(state)
        doFlash(`Loaded: ${getSaveLabel(key, gameName)}`)
      } else {
        doFlash('game helper not available')
      }
    } catch {
      doFlash('Invalid save data')
    }
  }, [g, gameName, doFlash])

  const handleDownloadSave = useCallback((key: string) => {
    const raw = localStorage.getItem(key)
    if (!raw) { doFlash('Save not found'); return }
    const label = getSaveLabel(key, gameName)
    const blob = new Blob([raw], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${gameName}-${label.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
    doFlash(`Downloaded: ${label}`)
  }, [gameName, doFlash])

  const handleDelete = useCallback((key: string) => {
    localStorage.removeItem(key)
    setSaveRefresh(n => n + 1)
    doFlash(`Deleted: ${getSaveLabel(key, gameName)}`)
  }, [gameName, doFlash])

  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const state = JSON.parse(reader.result as string)
        if (g) {
          g.new(state)
          doFlash(`Imported: ${file.name}`)
        } else {
          doFlash('game helper not available')
        }
      } catch {
        doFlash('Invalid JSON file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [g, doFlash])

  const handleImportPaste = useCallback(() => {
    if (!importText.trim()) { setPasteError('Paste a JSON state first'); return }
    try {
      const state = JSON.parse(importText)
      if (g) {
        g.new(state)
        setImportText('')
        setPasteError(null)
        setShowPasteModal(false)
        doFlash('State imported!')
      } else {
        setPasteError('game helper not available')
      }
    } catch {
      setPasteError('Invalid JSON — check syntax')
    }
  }, [g, importText, doFlash])

  const handlePasteChange = useCallback((value: string) => {
    setImportText(value)
    setPasteError(null)
    // Try to pretty-print if valid
    try {
      const parsed = JSON.parse(value)
      setImportText(JSON.stringify(parsed, null, 2))
    } catch {
      // Keep raw text if invalid
    }
  }, [])

  const handleDownloadState = useCallback(() => {
    if (!gameState) { doFlash('No game state'); return }
    const json = JSON.stringify(gameState, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${gameName}-state-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
    doFlash('State downloaded')
  }, [gameState, gameName, doFlash])

  const handleMenuClick = (id: MenuId) => {
    setActiveMenu(prev => prev === id ? null : id)
  }

  const handleMenuHover = (id: MenuId) => {
    setActiveMenu(id)
  }

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
                  onClick={() => handleMenuClick(item.id)}
                  onMouseEnter={() => handleMenuHover(item.id)}
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
                {activeMenu === 'game' && (
                  <>
                    {/* New Game */}
                    <div css={devToolBtnCss}>
                      <span css={devToolIconCss}>{'\u21BB'}</span>
                      <span css={devToolLabelCss}>New Game</span>
                      <span css={devToolDescCss}>Reset with N players</span>
                      <div css={inlineRowCss} onClick={e => e.stopPropagation()}>
                        <button css={stepBtnCss} onClick={() => setNewGamePlayers(c => Math.max(1, c - 1))}>-</button>
                        <input type="number" min={1} max={10} value={newGamePlayers}
                          onChange={e => setNewGamePlayers(Math.max(1, parseInt(e.target.value) || 2))}
                          css={numberInputCss} />
                        <button css={stepBtnCss} onClick={() => setNewGamePlayers(c => Math.min(10, c + 1))}>+</button>
                        <button css={goBtnCss}
                          onClick={() => exec(() => {
                            const hasOptions = gameOptions?.length && Object.values(options).some(Boolean)
                            g.new(hasOptions ? { players: newGamePlayers, ...options } : newGamePlayers)
                          }, `New game ${newGamePlayers}p`)}>
                          Go
                        </button>
                      </div>
                      {gameOptions?.map(opt => (
                        <label key={opt.key} css={toggleRowCss} onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={options[opt.key] ?? false}
                            onChange={e => setOptions(prev => ({ ...prev, [opt.key]: e.target.checked }))}
                            css={checkboxCss}
                          />
                          <span css={toggleLabelCss}>{opt.label}</span>
                        </label>
                      ))}
                    </div>

                    {/* Undo */}
                    <div css={devToolBtnCss}>
                      <span css={devToolIconCss}>{'\u238C'}</span>
                      <span css={devToolLabelCss}>Undo</span>
                      <span css={devToolDescCss}>Revert N moves</span>
                      <div css={inlineRowCss} onClick={e => e.stopPropagation()}>
                        <button css={stepBtnCss} onClick={() => setUndoCount(c => Math.max(1, c - 1))}>-</button>
                        <input type="number" min={1} max={999} value={undoCount}
                          onChange={e => setUndoCount(Math.max(1, parseInt(e.target.value) || 1))}
                          css={numberInputCss} />
                        <button css={stepBtnCss} onClick={() => setUndoCount(c => c + 1)}>+</button>
                        <button css={goBtnCss}
                          onClick={() => exec(() => g.undo(undoCount), `Undo ${undoCount} move${undoCount > 1 ? 's' : ''}`)}>
                          Go
                        </button>
                      </div>
                    </div>

                    {/* Switch Player */}
                    <div css={devToolBtnCss}>
                      <span css={devToolIconCss}>{'\u2194'}</span>
                      <span css={devToolLabelCss}>Switch Player</span>
                      <span css={devToolDescCss}>View as another player</span>
                      <div css={inlineRowCss} onClick={e => e.stopPropagation()}>
                        {players.map(pid => (
                          <button key={String(pid)}
                            css={[playerBtnCss, pid === currentPlayer && playerBtnActiveCss]}
                            onClick={() => exec(() => g.changePlayer(pid), `Switched to P${pid}`)}>
                            P{String(pid)}
                          </button>
                        ))}
                        <button
                          css={[playerBtnCss, currentPlayer === undefined && playerBtnActiveCss]}
                          onClick={() => exec(() => g.changePlayer(), 'Spectator mode')}>
                          Spect
                        </button>
                      </div>
                    </div>

                    {/* Bot */}
                    <button css={[devToolBtnCss, botActive && toolBtnActiveCss]}
                      onClick={() => {
                        const next = !botActive
                        exec(() => g.bot(next), next ? 'Bots enabled' : 'Bots disabled')
                        setBotActive(next)
                      }}>
                      <span css={devToolIconCss}>{'\u2699'}</span>
                      <span css={devToolLabelCss}>{botActive ? 'Disable Bots' : 'Enable Bots'}</span>
                      <span css={devToolDescCss}>{botActive ? 'Stop auto-play' : 'Auto-play all moves'}</span>
                      {botActive && <span css={activeIndicatorCss} />}
                    </button>

                    {/* Tutorial */}
                    <button css={devToolBtnCss}
                      onClick={() => exec(() => g.tutorial(), 'Tutorial started')}>
                      <span css={devToolIconCss}>?</span>
                      <span css={devToolLabelCss}>Tutorial</span>
                      <span css={devToolDescCss}>Start tutorial mode</span>
                    </button>
                  </>
                )}

                {activeMenu === 'save' && (
                  <>
                    {/* Save current state */}
                    <div css={devToolBtnCss}>
                      <span css={devToolIconCss}>{'\u2B73'}</span>
                      <span css={devToolLabelCss}>Save State</span>
                      <span css={devToolDescCss}>Save current game state</span>
                      <div css={inlineRowCss} onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          placeholder="label (optional)"
                          value={saveLabel}
                          onChange={e => setSaveLabel(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                          css={textInputCss}
                        />
                        <button css={goBtnCss} onClick={handleSave}>Save</button>
                      </div>
                    </div>

                    {/* Saved states list */}
                    {saveKeys.length > 0 && (
                      <div css={savedListCss}>
                        {saveKeys.map(key => (
                          <div key={key} css={savedEntryCss}>
                            <span css={savedLabelCss}>{getSaveLabel(key, gameName)}</span>
                            <div css={savedActionsCss}>
                              <button css={smallBtnCss} onClick={() => handleLoad(key)} title="Load">{'\u25B6'}</button>
                              <button css={smallBtnCss} onClick={() => handleDownloadSave(key)} title="Download">{'\u2913'}</button>
                              <button css={[smallBtnCss, smallBtnDangerCss]} onClick={() => handleDelete(key)} title="Delete">{'\u2715'}</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div css={dividerCss} />

                    {/* Import from file */}
                    <button css={devToolBtnCss} onClick={() => fileInputRef.current?.click()}>
                      <span css={devToolIconCss}>{'\u2912'}</span>
                      <span css={devToolLabelCss}>Import File</span>
                      <span css={devToolDescCss}>Load state from JSON file</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleImportFile}
                      style={{ display: 'none' }}
                    />

                    {/* Import from paste */}
                    <button css={devToolBtnCss} onClick={() => { setShowPasteModal(true); setPasteError(null) }}>
                      <span css={devToolIconCss}>{'\u2398'}</span>
                      <span css={devToolLabelCss}>Paste State</span>
                      <span css={devToolDescCss}>Open editor to paste JSON</span>
                    </button>
                  </>
                )}

                {activeMenu === 'export' && (
                  <>
                    {/* Download State */}
                    <button css={devToolBtnCss} onClick={handleDownloadState}>
                      <span css={devToolIconCss}>{'\u2913'}</span>
                      <span css={devToolLabelCss}>Download State</span>
                      <span css={devToolDescCss}>Save state as .json file</span>
                    </button>

                    {/* Copy LocalStorage */}
                    <button css={devToolBtnCss}
                      onClick={() => {
                        const data: Record<string, string> = {}
                        for (let i = 0; i < localStorage.length; i++) {
                          const key = localStorage.key(i)
                          if (key) data[key] = localStorage.getItem(key) ?? ''
                        }
                        copyToClipboard(JSON.stringify(data, null, 2), 'localStorage')
                      }}>
                      <span css={devToolIconCss}>{'\u29C9'}</span>
                      <span css={devToolLabelCss}>Copy LocalStorage</span>
                      <span css={devToolDescCss}>Copy localStorage to clipboard</span>
                    </button>
                  </>
                )}

                {activeMenu === 'custom' && children}
              </div>
            </div>
          )}
        </div>
        </>
      )}

      {/* Paste State Modal */}
      {showPasteModal && (
        <>
          <div css={modalBackdropCss} onClick={() => { setShowPasteModal(false); setPasteError(null) }} />
          <div css={modalCss}>
            <div css={modalHeaderCss}>
              <span css={modalTitleCss}>Paste Game State</span>
              <button css={modalCloseBtnCss} onClick={() => { setShowPasteModal(false); setPasteError(null) }}>{'\u2715'}</button>
            </div>
            <div css={modalBodyCss}>
              <textarea
                css={modalTextareaCss}
                placeholder='Paste your JSON game state here...'
                value={importText}
                onChange={e => handlePasteChange(e.target.value)}
                spellCheck={false}
              />
              {importText.trim() && (
                <div css={jsonPreviewCss}>
                  <div css={jsonPreviewLabelCss}>Preview</div>
                  <pre css={jsonPreviewCodeCss}>
                    {(() => {
                      try {
                        return highlightJson(JSON.stringify(JSON.parse(importText), null, 2))
                      } catch {
                        return <span css={jsonErrorTextCss}>{importText}</span>
                      }
                    })()}
                  </pre>
                </div>
              )}
              {pasteError && <div css={pasteErrorCss}>{pasteError}</div>}
            </div>
            <div css={modalFooterCss}>
              <button css={modalCancelBtnCss} onClick={() => { setShowPasteModal(false); setPasteError(null) }}>Cancel</button>
              <button css={modalLoadBtnCss} onClick={handleImportPaste}>Load State</button>
            </div>
          </div>
        </>
      )}
    </>,
    root
  )
}

// ═══════════════════════════════════════
//  Styles — GamePark branded
// ═══════════════════════════════════════

const fabPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(40, 184, 206, 0.25); }
  50% { box-shadow: 0 0 0 5px rgba(40, 184, 206, 0); }
`

const fabCss = css`
  position: fixed;
  bottom: 16px;
  left: 16px;
  z-index: 900;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(40, 184, 206, 0.4);
  background: linear-gradient(145deg, ${GP_SURFACE}, ${GP_DARK});
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  animation: ${fabPulse} 3s ease-in-out infinite;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(40, 184, 206, 0.7);
    animation: none;
  }

  &[data-open="true"] {
    animation: none;
    background: ${GP_PRIMARY};
    border-color: ${GP_PRIMARY};
  }
`

const logoCss = css`
  width: 22px;
  height: 22px;
  fill: ${GP_PRIMARY};
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &[data-open="true"] {
    fill: ${GP_DARK};
    transform: rotate(90deg);
  }
`

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(8px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`

const slideRight = keyframes`
  from { opacity: 0; transform: translateX(-8px) scale(0.97); }
  to { opacity: 1; transform: translateX(0) scale(1); }
`

const hubContainerCss = css`
  position: fixed;
  bottom: 64px;
  left: 16px;
  z-index: 900;
  display: flex;
  align-items: flex-end;
  gap: 6px;
`

const mainMenuCss = css`
  position: relative;
  width: 200px;
  background: linear-gradient(170deg, #0f2035 0%, ${GP_SURFACE} 100%);
  border: 1px solid rgba(40, 184, 206, 0.25);
  border-radius: 12px;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(159, 226, 247, 0.05);
  animation: ${slideUp} 0.2s ease-out;
  font-family: 'Mulish', sans-serif;
  overflow: hidden;
`

const subPanelCss = css`
  width: 320px;
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  background: linear-gradient(170deg, #0f2035 0%, ${GP_SURFACE} 100%);
  border: 1px solid rgba(40, 184, 206, 0.25);
  border-radius: 12px;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(159, 226, 247, 0.05);
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
  font-size: 12px;
  font-weight: 800;
  color: #5a8a98;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`

const subPanelContentCss = css`
  display: flex;
  flex-direction: column;
  padding: 6px;
  gap: 2px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`

const panelHeaderCss = css`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(40, 184, 206, 0.15);
  background: rgba(40, 184, 206, 0.04);
`

const headerLogoCss = css`
  width: 18px;
  height: 18px;
  fill: ${GP_ACCENT};
  flex-shrink: 0;
`

const panelTitleCss = css`
  font-size: 14px;
  font-weight: 800;
  color: #e0f0f4;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  flex: 1;
`

const panelBadgeCss = css`
  font-size: 9px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(40, 184, 206, 0.15);
  color: ${GP_PRIMARY};
  letter-spacing: 0.1em;
`

const menuListCss = css`
  display: flex;
  flex-direction: column;
  padding: 6px;
  gap: 2px;
`

const menuItemCss = css`
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  font-family: inherit;

  &:hover {
    background: rgba(40, 184, 206, 0.08);
  }
`

const menuItemActiveCss = css`
  background: rgba(40, 184, 206, 0.12);

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 18px;
    border-radius: 0 3px 3px 0;
    background: ${GP_PRIMARY};
  }
`

const menuItemIconCss = css`
  font-size: 15px;
  color: ${GP_PRIMARY};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(40, 184, 206, 0.08);
  flex-shrink: 0;
`

const menuItemLabelCss = css`
  font-size: 13px;
  font-weight: 700;
  color: #e0f0f4;
  flex: 1;
`

const menuChevronCss = css`
  font-size: 10px;
  color: #3a6070;
`

const toolReveal = keyframes`
  from { opacity: 0; transform: translateX(-6px); }
  to { opacity: 1; transform: translateX(0); }
`

export const devToolBtnCss = css`
  position: relative;
  display: grid;
  grid-template-columns: 28px 1fr;
  grid-template-rows: auto auto;
  align-items: center;
  gap: 0 10px;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  animation: ${toolReveal} 0.25s ease-out backwards;
  font-family: inherit;

  &:hover {
    background: rgba(40, 184, 206, 0.08);
  }
  &:active {
    background: rgba(40, 184, 206, 0.14);
  }
`

const toolBtnActiveCss = css`
  background: rgba(40, 184, 206, 0.1);
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 8px;
    bottom: 8px;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: ${GP_PRIMARY};
  }
`

export const devToolIconCss = css`
  grid-row: 1 / -1;
  font-size: 15px;
  color: ${GP_PRIMARY};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(40, 184, 206, 0.08);
`

export const devToolLabelCss = css`
  font-size: 14px;
  font-weight: 700;
  color: #e0f0f4;
  line-height: 1.2;
`

export const devToolDescCss = css`
  font-size: 12px;
  color: #5a8a98;
  line-height: 1.2;
`

const activeIndicatorCss = css`
  position: absolute;
  top: 10px;
  right: 12px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${GP_PRIMARY};
  box-shadow: 0 0 6px rgba(40, 184, 206, 0.5);
`

const dividerCss = css`
  height: 1px;
  margin: 4px 12px;
  background: rgba(40, 184, 206, 0.1);
`

// ── Inline controls ──

const inlineRowCss = css`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
`

const stepBtnCss = css`
  width: 26px;
  height: 26px;
  border-radius: 5px;
  border: 1px solid rgba(40, 184, 206, 0.25);
  background: rgba(40, 184, 206, 0.06);
  color: ${GP_PRIMARY};
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  transition: all 0.15s;

  &:hover {
    background: rgba(40, 184, 206, 0.14);
    border-color: rgba(40, 184, 206, 0.4);
  }
`

const numberInputCss = css`
  width: 48px;
  height: 26px;
  border-radius: 5px;
  border: 1px solid rgba(40, 184, 206, 0.25);
  background: rgba(0, 0, 0, 0.3);
  color: #e0f0f4;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  font-family: inherit;
  font-variant-numeric: tabular-nums;

  &:focus {
    outline: none;
    border-color: ${GP_PRIMARY};
    box-shadow: 0 0 0 2px rgba(40, 184, 206, 0.15);
  }

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`

const textInputCss = css`
  flex: 1;
  height: 26px;
  border-radius: 5px;
  border: 1px solid rgba(40, 184, 206, 0.25);
  background: rgba(0, 0, 0, 0.3);
  color: #e0f0f4;
  font-size: 12px;
  font-weight: 600;
  padding: 0 8px;
  font-family: inherit;

  &::placeholder {
    color: #3a6070;
  }

  &:focus {
    outline: none;
    border-color: ${GP_PRIMARY};
    box-shadow: 0 0 0 2px rgba(40, 184, 206, 0.15);
  }
`

const goBtnCss = css`
  height: 26px;
  padding: 0 12px;
  border-radius: 5px;
  border: 1px solid rgba(40, 184, 206, 0.35);
  background: rgba(40, 184, 206, 0.15);
  color: ${GP_PRIMARY};
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  margin-left: auto;
  font-family: inherit;
  transition: all 0.15s;
  flex-shrink: 0;

  &:hover {
    background: rgba(40, 184, 206, 0.25);
    border-color: rgba(40, 184, 206, 0.5);
  }
`

const playerBtnCss = css`
  height: 26px;
  padding: 0 10px;
  border-radius: 5px;
  border: 1px solid rgba(40, 184, 206, 0.25);
  background: rgba(40, 184, 206, 0.06);
  color: #5a8a98;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;

  &:hover {
    background: rgba(40, 184, 206, 0.14);
    border-color: rgba(40, 184, 206, 0.4);
    color: #e0f0f4;
  }
`

const playerBtnActiveCss = css`
  background: rgba(40, 184, 206, 0.2);
  border-color: ${GP_PRIMARY};
  color: ${GP_PRIMARY};
`

// ── Save/Load styles ──

const savedListCss = css`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 8px;
`

const savedEntryCss = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  border-radius: 5px;
  background: rgba(40, 184, 206, 0.04);
  border: 1px solid rgba(40, 184, 206, 0.08);
`

const savedLabelCss = css`
  font-size: 12px;
  font-weight: 600;
  color: #8ab8c8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 8px;
`

const savedActionsCss = css`
  display: flex;
  gap: 4px;
  flex-shrink: 0;
`

const smallBtnCss = css`
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: 1px solid rgba(40, 184, 206, 0.25);
  background: rgba(40, 184, 206, 0.08);
  color: ${GP_PRIMARY};
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  transition: all 0.15s;

  &:hover {
    background: rgba(40, 184, 206, 0.2);
    border-color: rgba(40, 184, 206, 0.4);
  }
`

const smallBtnDangerCss = css`
  &:hover {
    background: rgba(220, 60, 60, 0.2);
    border-color: rgba(220, 60, 60, 0.4);
    color: #dc3c3c;
  }
`

// ── Backdrop (click-outside to close) ──

const backdropCss = css`
  position: fixed;
  inset: 0;
  z-index: 899;
`

// ── Paste Modal ──

const modalBackdropCss = css`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
`

const modalFadeIn = keyframes`
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
`

const modalCss = css`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1001;
  width: min(700px, 90vw);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(170deg, #0f2035 0%, ${GP_SURFACE} 100%);
  border: 1px solid rgba(40, 184, 206, 0.3);
  border-radius: 12px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7);
  font-family: 'Mulish', sans-serif;
  animation: ${modalFadeIn} 0.2s ease-out;
`

const modalHeaderCss = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(40, 184, 206, 0.15);
  background: rgba(40, 184, 206, 0.04);
  border-radius: 12px 12px 0 0;
`

const modalTitleCss = css`
  font-size: 14px;
  font-weight: 800;
  color: #e0f0f4;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`

const modalCloseBtnCss = css`
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: rgba(40, 184, 206, 0.08);
  color: #5a8a98;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;

  &:hover {
    background: rgba(220, 60, 60, 0.2);
    color: #dc3c3c;
  }
`

const modalBodyCss = css`
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
`

const modalTextareaCss = css`
  width: 100%;
  min-height: 100px;
  border-radius: 8px;
  border: 1px solid rgba(40, 184, 206, 0.25);
  background: rgba(0, 0, 0, 0.4);
  color: #e0f0f4;
  font-size: 13px;
  font-weight: 500;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  resize: vertical;
  line-height: 1.5;

  &::placeholder {
    color: #3a6070;
  }

  &:focus {
    outline: none;
    border-color: ${GP_PRIMARY};
    box-shadow: 0 0 0 2px rgba(40, 184, 206, 0.15);
  }
`

const jsonPreviewCss = css`
  border-radius: 8px;
  border: 1px solid rgba(40, 184, 206, 0.15);
  background: rgba(0, 0, 0, 0.3);
  overflow: hidden;
`

const jsonPreviewLabelCss = css`
  font-size: 10px;
  font-weight: 800;
  color: #3a6070;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 6px 12px;
  border-bottom: 1px solid rgba(40, 184, 206, 0.08);
`

const jsonPreviewCodeCss = css`
  padding: 12px;
  margin: 0;
  font-size: 12px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  line-height: 1.6;
  color: #8ab8c8;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre;
  tab-size: 2;
`

const pasteErrorCss = css`
  font-size: 12px;
  font-weight: 700;
  color: #dc3c3c;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(220, 60, 60, 0.1);
  border: 1px solid rgba(220, 60, 60, 0.2);
`

const modalFooterCss = css`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid rgba(40, 184, 206, 0.15);
`

const modalCancelBtnCss = css`
  height: 32px;
  padding: 0 16px;
  border-radius: 6px;
  border: 1px solid rgba(40, 184, 206, 0.25);
  background: transparent;
  color: #5a8a98;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;

  &:hover {
    background: rgba(40, 184, 206, 0.08);
    color: #e0f0f4;
  }
`

const modalLoadBtnCss = css`
  height: 32px;
  padding: 0 20px;
  border-radius: 6px;
  border: 1px solid rgba(40, 184, 206, 0.4);
  background: rgba(40, 184, 206, 0.2);
  color: ${GP_PRIMARY};
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;

  &:hover {
    background: rgba(40, 184, 206, 0.35);
    border-color: ${GP_PRIMARY};
  }
`

// ── JSON syntax colors ──

const jsonKeyCss = css`
  color: ${GP_ACCENT};
`

const jsonStringCss = css`
  color: #8bbb6a;
`

const jsonBoolCss = css`
  color: #d4872a;
`

const jsonNumCss = css`
  color: #c4a0e8;
`

const jsonPunctCss = css`
  color: #5a6a78;
`

const jsonErrorTextCss = css`
  color: #dc3c3c;
`

// ── Flash ──

const flashFade = keyframes`
  0% { opacity: 0; transform: translateY(6px); }
  15% { opacity: 1; transform: translateY(0); }
  85% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-6px); }
`

const flashCss = css`
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  margin-bottom: 8px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 700;
  color: ${GP_PRIMARY};
  text-align: center;
  background: linear-gradient(145deg, ${GP_SURFACE}, ${GP_DARK});
  border: 1px solid rgba(40, 184, 206, 0.3);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  white-space: nowrap;
  pointer-events: none;
  animation: ${flashFade} 1.5s ease-out forwards;
`

// ── Game Options toggles ──

const toggleRowCss = css`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding: 4px 0;
  cursor: pointer;
`

const checkboxCss = css`
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(40, 184, 206, 0.35);
  background: rgba(0, 0, 0, 0.3);
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
  transition: all 0.15s;

  &:checked {
    background: rgba(40, 184, 206, 0.2);
    border-color: ${GP_PRIMARY};
  }

  &:checked::after {
    content: '\u2713';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 11px;
    color: ${GP_PRIMARY};
    font-weight: 700;
  }

  &:hover {
    border-color: rgba(40, 184, 206, 0.5);
  }
`

const toggleLabelCss = css`
  font-size: 12px;
  font-weight: 600;
  color: #5a8a98;
`
