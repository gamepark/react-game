/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react'
import { FC, useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useGame } from '../../../hooks/useGame'
import { usePlayerId, usePlayerIds } from '../../../hooks/usePlayerId'

const GP_PRIMARY = '#28B8CE'
const GP_DARK = '#002448'
const GP_SURFACE = '#0a1929'
const GP_ACCENT = '#9fe2f7'

export const DevToolsHub: FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [undoCount, setUndoCount] = useState(1)
  const [monkeyActive, setMonkeyActive] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const gameState = useGame()
  const currentPlayer = usePlayerId()
  const players = usePlayerIds()

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

  const root = document.getElementById('root')
  if (!root) return null

  return createPortal(
    <>
      <button css={fabCss} onClick={() => setIsOpen(o => !o)} data-open={isOpen}>
        <svg css={logoCss} viewBox="0 0 46 46" data-open={isOpen}>
          <circle cx="11" cy="11" r="7" />
          <circle cx="35" cy="11" r="7" />
          <circle cx="11" cy="35" r="7" />
          <circle cx="35" cy="35" r="7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div css={backdropCss} onClick={() => setIsOpen(false)} />
          <div css={panelCss}>
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

            <div css={toolListCss}>
              {/* New Game */}
              <button css={toolBtnCss} style={{ animationDelay: '0ms' }}
                onClick={() => exec(() => g.new(), 'New game started')}>
                <span css={toolIconCss}>{'\u21BB'}</span>
                <span css={toolLabelCss}>New Game</span>
                <span css={toolDescCss}>Reset game state</span>
              </button>

              {/* Undo */}
              <div css={toolBtnCss} style={{ animationDelay: '40ms' }}>
                <span css={toolIconCss}>{'\u238C'}</span>
                <span css={toolLabelCss}>Undo</span>
                <span css={toolDescCss}>Revert N moves</span>
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
              <div css={toolBtnCss} style={{ animationDelay: '80ms' }}>
                <span css={toolIconCss}>{'\u2194'}</span>
                <span css={toolLabelCss}>Switch Player</span>
                <span css={toolDescCss}>View as another player</span>
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
              <button css={toolBtnCss} style={{ animationDelay: '120ms' }}
                onClick={() => exec(() => g.bot(), 'Bot move played')}>
                <span css={toolIconCss}>{'\u2699'}</span>
                <span css={toolLabelCss}>Bot Move</span>
                <span css={toolDescCss}>Play one bot move</span>
              </button>

              {/* Monkey */}
              <button css={[toolBtnCss, monkeyActive && toolBtnActiveCss]}
                style={{ animationDelay: '160ms' }}
                onClick={() => {
                  const next = !monkeyActive
                  exec(() => g.monkeyOpponents(next), next ? 'Monkey ON' : 'Monkey OFF')
                  setMonkeyActive(next)
                }}>
                <span css={toolIconCss}>{'\u2689'}</span>
                <span css={toolLabelCss}>Monkey</span>
                <span css={toolDescCss}>Toggle random opponent</span>
                {monkeyActive && <span css={activeIndicatorCss} />}
              </button>

              {/* Tutorial */}
              <button css={toolBtnCss} style={{ animationDelay: '200ms' }}
                onClick={() => exec(() => g.tutorial(), 'Tutorial started')}>
                <span css={toolIconCss}>?</span>
                <span css={toolLabelCss}>Tutorial</span>
                <span css={toolDescCss}>Start tutorial mode</span>
              </button>

              <div css={dividerCss} />

              {/* Copy State */}
              <button css={toolBtnCss} style={{ animationDelay: '240ms' }}
                onClick={() => {
                  if (gameState) copyToClipboard(JSON.stringify(gameState, null, 2), 'Game state')
                  else doFlash('No game state')
                }}>
                <span css={toolIconCss}>{'\u2398'}</span>
                <span css={toolLabelCss}>Copy State</span>
                <span css={toolDescCss}>Copy game state to clipboard</span>
              </button>

              {/* Copy LocalStorage */}
              <button css={toolBtnCss} style={{ animationDelay: '280ms' }}
                onClick={() => {
                  const data: Record<string, string> = {}
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i)
                    if (key) data[key] = localStorage.getItem(key) ?? ''
                  }
                  copyToClipboard(JSON.stringify(data, null, 2), 'localStorage')
                }}>
                <span css={toolIconCss}>{'\u29C9'}</span>
                <span css={toolLabelCss}>Copy LocalStorage</span>
                <span css={toolDescCss}>Copy localStorage to clipboard</span>
              </button>
            </div>

            {flash && <div css={flashCss} key={flash}>{flash}</div>}
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
  z-index: 9999;
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

const backdropCss = css`
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
`

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(8px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`

const panelCss = css`
  position: fixed;
  bottom: 64px;
  left: 16px;
  z-index: 9999;
  width: 320px;
  background: linear-gradient(170deg, #0f2035 0%, ${GP_SURFACE} 100%);
  border: 1px solid rgba(40, 184, 206, 0.25);
  border-radius: 12px;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(159, 226, 247, 0.05);
  overflow: hidden;
  animation: ${slideUp} 0.2s ease-out;
  font-family: 'Mulish', sans-serif;
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
  font-size: 13px;
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

const toolReveal = keyframes`
  from { opacity: 0; transform: translateX(-6px); }
  to { opacity: 1; transform: translateX(0); }
`

const toolListCss = css`
  display: flex;
  flex-direction: column;
  padding: 6px;
  gap: 2px;
`

const toolBtnCss = css`
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

const toolIconCss = css`
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

const toolLabelCss = css`
  font-size: 13px;
  font-weight: 700;
  color: #e0f0f4;
  line-height: 1.2;
`

const toolDescCss = css`
  font-size: 11px;
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

// ── Flash ──

const flashFade = keyframes`
  0% { opacity: 0; transform: translateY(4px); }
  15% { opacity: 1; transform: translateY(0); }
  85% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-4px); }
`

const flashCss = css`
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 700;
  color: ${GP_PRIMARY};
  text-align: center;
  border-top: 1px solid rgba(40, 184, 206, 0.1);
  background: rgba(40, 184, 206, 0.04);
  animation: ${flashFade} 1.5s ease-out forwards;
`
