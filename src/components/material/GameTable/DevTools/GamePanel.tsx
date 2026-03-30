/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react'
import { FC, useState } from 'react'
import { usePlayerId, usePlayerIds } from '../../../../hooks/usePlayerId'
import { GameOption } from './DevToolsHub'

const GP_PRIMARY = '#28B8CE'

const toolReveal = keyframes`
  from { opacity: 0; transform: translateX(-0.375em); }
  to { opacity: 1; transform: translateX(0); }
`

type GamePanelProps = {
  exec: (action: () => void, msg: string) => void
  g: any
  gameOptions?: GameOption[]
}

export const GamePanel: FC<GamePanelProps> = ({ exec, g, gameOptions }) => {
  const [newGamePlayers, setNewGamePlayers] = useState(2)
  const [options, setOptions] = useState<Record<string, boolean>>({})
  const [undoCount, setUndoCount] = useState(1)
  const [botActive, setBotActive] = useState(false)

  const currentPlayer = usePlayerId()
  const players = usePlayerIds()

  return (
    <>
      {/* New Game */}
      <div css={toolBtnCss}>
        <span css={toolIconCss}>{'\u21BB'}</span>
        <span css={toolLabelCss}>New Game</span>
        <span css={toolDescCss}>Reset with N players</span>
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
      <div css={toolBtnCss}>
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
      <div css={toolBtnCss}>
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

      {/* Tutorial */}
      <button css={toolBtnCss}
        onClick={() => exec(() => g.tutorial(), 'Tutorial started')}>
        <span css={toolIconCss}>?</span>
        <span css={toolLabelCss}>Tutorial</span>
        <span css={toolDescCss}>Start tutorial mode</span>
      </button>
    </>
  )
}

// ── Styles ──

const toolBtnCss = css`
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

const toolBtnActiveCss = css`
  background: rgba(40, 184, 206, 0.1);
  &::after {
    content: '';
    position: absolute;
    left: 0; top: 0.5em; bottom: 0.5em;
    width: 0.2em;
    border-radius: 0 0.2em 0.2em 0;
    background: ${GP_PRIMARY};
  }
`

const toolIconCss = css`
  grid-row: 1 / -1;
  color: ${GP_PRIMARY};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75em; height: 1.75em;
  border-radius: 0.375em;
  background: rgba(40, 184, 206, 0.08);
`

const toolLabelCss = css`
  font-weight: 700;
  color: #e0f0f4;
  line-height: 1.2;
`

const toolDescCss = css`
  color: #5a8a98;
  line-height: 1.2;
`

const activeIndicatorCss = css`
  position: absolute;
  top: 0.625em; right: 0.75em;
  width: 0.44em; height: 0.44em;
  border-radius: 50%;
  background: ${GP_PRIMARY};
  box-shadow: 0 0 0.375em rgba(40, 184, 206, 0.5);
`

const inlineRowCss = css`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 0.25em;
  margin-top: 0.375em;
`

const stepBtnCss = css`
  width: 1.625em; height: 1.625em;
  border-radius: 0.3em;
  border: 0.06em solid rgba(40, 184, 206, 0.25);
  background: rgba(40, 184, 206, 0.06);
  color: ${GP_PRIMARY};
  font-weight: 700;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-family: inherit;
  transition: all 0.15s;
  &:hover { background: rgba(40, 184, 206, 0.14); border-color: rgba(40, 184, 206, 0.4); }
`

const numberInputCss = css`
  width: 3em; height: 1.625em;
  border-radius: 0.3em;
  border: 0.06em solid rgba(40, 184, 206, 0.25);
  background: rgba(0, 0, 0, 0.3);
  color: #e0f0f4;
  font-weight: 700;
  text-align: center;
  font-family: inherit;
  font-variant-numeric: tabular-nums;
  &:focus { outline: none; border-color: ${GP_PRIMARY}; box-shadow: 0 0 0 0.125em rgba(40, 184, 206, 0.15); }
  &::-webkit-inner-spin-button, &::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
`

const goBtnCss = css`
  height: 1.625em;
  padding: 0 0.75em;
  border-radius: 0.3em;
  border: 0.06em solid rgba(40, 184, 206, 0.35);
  background: rgba(40, 184, 206, 0.15);
  color: ${GP_PRIMARY};
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  margin-left: auto;
  font-family: inherit;
  transition: all 0.15s;
  flex-shrink: 0;
  &:hover { background: rgba(40, 184, 206, 0.25); border-color: rgba(40, 184, 206, 0.5); }
`

const playerBtnCss = css`
  height: 1.625em;
  padding: 0 0.625em;
  border-radius: 0.3em;
  border: 0.06em solid rgba(40, 184, 206, 0.25);
  background: rgba(40, 184, 206, 0.06);
  color: #5a8a98;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  &:hover { background: rgba(40, 184, 206, 0.14); border-color: rgba(40, 184, 206, 0.4); color: #e0f0f4; }
`

const playerBtnActiveCss = css`
  background: rgba(40, 184, 206, 0.2);
  border-color: ${GP_PRIMARY};
  color: ${GP_PRIMARY};
`

const toggleRowCss = css`
  grid-column: 1 / -1;
  display: flex; align-items: center; gap: 0.5em;
  margin-top: 0.25em; padding: 0.25em 0;
  cursor: pointer;
`

const checkboxCss = css`
  appearance: none;
  width: 1em; height: 1em;
  border-radius: 0.25em;
  border: 0.06em solid rgba(40, 184, 206, 0.35);
  background: rgba(0, 0, 0, 0.3);
  cursor: pointer; flex-shrink: 0;
  position: relative;
  transition: all 0.15s;
  &:checked { background: rgba(40, 184, 206, 0.2); border-color: ${GP_PRIMARY}; }
  &:checked::after {
    content: '\u2713';
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    color: ${GP_PRIMARY}; font-weight: 700;
  }
  &:hover { border-color: rgba(40, 184, 206, 0.5); }
`

const toggleLabelCss = css`
  font-weight: 600; color: #5a8a98;
`
