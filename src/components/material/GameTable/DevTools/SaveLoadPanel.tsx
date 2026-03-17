/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react'
import { FC, useCallback, useRef, useState } from 'react'

const GP_PRIMARY = '#28B8CE'
const GP_SURFACE = '#0a1929'

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

type SaveLoadPanelProps = {
  gameName: string
  doFlash: (msg: string) => void
}

export const SaveLoadPanel: FC<SaveLoadPanelProps> = ({ gameName, doFlash }) => {
  const [saveLabel, setSaveLabel] = useState('')
  const [saveRefresh, setSaveRefresh] = useState(0)
  const [importText, setImportText] = useState('')
  const [pasteError, setPasteError] = useState<string | null>(null)
  const [showPasteModal, setShowPasteModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const saveKeys = getSaveKeys(gameName)
  void saveRefresh

  const handleSave = useCallback(() => {
    const raw = localStorage.getItem(gameName)
    if (!raw) { doFlash('No game state in localStorage'); return }
    const label = saveLabel.trim() || new Date().toLocaleTimeString()
    const key = gameName + SAVE_PREFIX + label
    localStorage.setItem(key, raw)
    setSaveLabel('')
    setSaveRefresh(n => n + 1)
    doFlash(`Saved: ${label}`)
  }, [saveLabel, gameName, doFlash])

  const handleLoad = useCallback((key: string) => {
    const raw = localStorage.getItem(key)
    if (!raw) { doFlash('Save not found'); return }
    try {
      JSON.parse(raw)
      localStorage.setItem(gameName, raw)
      doFlash(`Loaded: ${getSaveLabel(key, gameName)}`)
      window.location.reload()
    } catch {
      doFlash('Invalid save data')
    }
  }, [gameName, doFlash])

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
        const raw = reader.result as string
        JSON.parse(raw)
        localStorage.setItem(gameName, raw)
        doFlash(`Imported: ${file.name}`)
        window.location.reload()
      } catch {
        doFlash('Invalid JSON file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [gameName, doFlash])

  const handleImportPaste = useCallback(() => {
    if (!importText.trim()) { setPasteError('Paste a JSON state first'); return }
    try {
      JSON.parse(importText)
      localStorage.setItem(gameName, importText)
      setImportText('')
      setPasteError(null)
      setShowPasteModal(false)
      doFlash('State imported!')
      window.location.reload()
    } catch {
      setPasteError('Invalid JSON — check syntax')
    }
  }, [gameName, importText, doFlash])

  const handlePasteChange = useCallback((value: string) => {
    setImportText(value)
    setPasteError(null)
    try {
      const parsed = JSON.parse(value)
      setImportText(JSON.stringify(parsed, null, 2))
    } catch {
      // Keep raw text if invalid
    }
  }, [])

  return (
    <>
      {/* Save current state */}
      <div css={toolBtnCss}>
        <span css={toolIconCss}>{'\u2B73'}</span>
        <span css={toolLabelCss}>Save State</span>
        <span css={toolDescCss}>Save current game state</span>
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
              <span css={savedLabelTextCss}>{getSaveLabel(key, gameName)}</span>
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
      <button css={toolBtnCss} onClick={() => fileInputRef.current?.click()}>
        <span css={toolIconCss}>{'\u2912'}</span>
        <span css={toolLabelCss}>Import File</span>
        <span css={toolDescCss}>Load state from JSON file</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImportFile}
        style={{ display: 'none' }}
      />

      {/* Import from paste */}
      <button css={toolBtnCss} onClick={() => { setShowPasteModal(true); setPasteError(null) }}>
        <span css={toolIconCss}>{'\u2398'}</span>
        <span css={toolLabelCss}>Paste State</span>
        <span css={toolDescCss}>Open editor to paste JSON</span>
      </button>

      {/* Paste Modal */}
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
              {pasteError && <div css={pasteErrorCss}>{pasteError}</div>}
            </div>
            <div css={modalFooterCss}>
              <button css={modalCancelBtnCss} onClick={() => { setShowPasteModal(false); setPasteError(null) }}>Cancel</button>
              <button css={modalLoadBtnCss} onClick={handleImportPaste}>Load State</button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

// ── Styles ──

const toolReveal = keyframes`
  from { opacity: 0; transform: translateX(-6px); }
  to { opacity: 1; transform: translateX(0); }
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
  &:hover { background: rgba(40, 184, 206, 0.08); }
  &:active { background: rgba(40, 184, 206, 0.14); }
`

const toolIconCss = css`
  grid-row: 1 / -1;
  font-size: 15px;
  color: ${GP_PRIMARY};
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px;
  border-radius: 6px;
  background: rgba(40, 184, 206, 0.08);
`

const toolLabelCss = css`
  font-size: 14px; font-weight: 700; color: #e0f0f4; line-height: 1.2;
`

const toolDescCss = css`
  font-size: 12px; color: #5a8a98; line-height: 1.2;
`

const inlineRowCss = css`
  grid-column: 1 / -1;
  display: flex; align-items: center; gap: 4px; margin-top: 6px;
`

const textInputCss = css`
  flex: 1; height: 26px;
  border-radius: 5px;
  border: 1px solid rgba(40, 184, 206, 0.25);
  background: rgba(0, 0, 0, 0.3);
  color: #e0f0f4;
  font-size: 12px; font-weight: 600;
  padding: 0 8px;
  font-family: inherit;
  &::placeholder { color: #3a6070; }
  &:focus { outline: none; border-color: ${GP_PRIMARY}; box-shadow: 0 0 0 2px rgba(40, 184, 206, 0.15); }
`

const goBtnCss = css`
  height: 26px; padding: 0 12px;
  border-radius: 5px;
  border: 1px solid rgba(40, 184, 206, 0.35);
  background: rgba(40, 184, 206, 0.15);
  color: ${GP_PRIMARY};
  font-size: 12px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.05em;
  cursor: pointer; margin-left: auto;
  font-family: inherit;
  transition: all 0.15s; flex-shrink: 0;
  &:hover { background: rgba(40, 184, 206, 0.25); border-color: rgba(40, 184, 206, 0.5); }
`

const dividerCss = css`
  height: 1px; margin: 4px 12px;
  background: rgba(40, 184, 206, 0.1);
`

const savedListCss = css`
  display: flex; flex-direction: column; gap: 2px; padding: 0 8px;
`

const savedEntryCss = css`
  display: flex; align-items: center; justify-content: space-between;
  padding: 5px 8px; border-radius: 5px;
  background: rgba(40, 184, 206, 0.04);
  border: 1px solid rgba(40, 184, 206, 0.08);
`

const savedLabelTextCss = css`
  font-size: 12px; font-weight: 600; color: #8ab8c8;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  flex: 1; margin-right: 8px;
`

const savedActionsCss = css`
  display: flex; gap: 4px; flex-shrink: 0;
`

const smallBtnCss = css`
  width: 22px; height: 22px;
  border-radius: 4px;
  border: 1px solid rgba(40, 184, 206, 0.25);
  background: rgba(40, 184, 206, 0.08);
  color: ${GP_PRIMARY};
  font-size: 10px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-family: inherit;
  transition: all 0.15s;
  &:hover { background: rgba(40, 184, 206, 0.2); border-color: rgba(40, 184, 206, 0.4); }
`

const smallBtnDangerCss = css`
  &:hover { background: rgba(220, 60, 60, 0.2); border-color: rgba(220, 60, 60, 0.4); color: #dc3c3c; }
`

// ── Modal ──

const modalFadeIn = keyframes`
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
`

const modalBackdropCss = css`
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
`

const modalCss = css`
  position: fixed; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1001;
  width: min(700px, 90vw);
  max-height: 80vh;
  display: flex; flex-direction: column;
  background: linear-gradient(170deg, #0f2035 0%, ${GP_SURFACE} 100%);
  border: 1px solid rgba(40, 184, 206, 0.3);
  border-radius: 12px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7);
  font-family: 'Mulish', sans-serif;
  animation: ${modalFadeIn} 0.2s ease-out;
`

const modalHeaderCss = css`
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(40, 184, 206, 0.15);
  background: rgba(40, 184, 206, 0.04);
  border-radius: 12px 12px 0 0;
`

const modalTitleCss = css`
  font-size: 14px; font-weight: 800; color: #e0f0f4;
  text-transform: uppercase; letter-spacing: 0.08em;
`

const modalCloseBtnCss = css`
  width: 28px; height: 28px;
  border: none; border-radius: 6px;
  background: rgba(40, 184, 206, 0.08);
  color: #5a8a98; font-size: 12px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
  &:hover { background: rgba(220, 60, 60, 0.2); color: #dc3c3c; }
`

const modalBodyCss = css`
  flex: 1; overflow-y: auto;
  padding: 16px 20px;
  display: flex; flex-direction: column; gap: 12px;
  min-height: 0;
`

const modalTextareaCss = css`
  width: 100%; min-height: 100px;
  border-radius: 8px;
  border: 1px solid rgba(40, 184, 206, 0.25);
  background: rgba(0, 0, 0, 0.4);
  color: #e0f0f4;
  font-size: 13px; font-weight: 500;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  resize: vertical; line-height: 1.5;
  &::placeholder { color: #3a6070; }
  &:focus { outline: none; border-color: ${GP_PRIMARY}; box-shadow: 0 0 0 2px rgba(40, 184, 206, 0.15); }
`

const pasteErrorCss = css`
  font-size: 12px; font-weight: 700; color: #dc3c3c;
  padding: 6px 10px; border-radius: 6px;
  background: rgba(220, 60, 60, 0.1);
  border: 1px solid rgba(220, 60, 60, 0.2);
`

const modalFooterCss = css`
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid rgba(40, 184, 206, 0.15);
`

const modalCancelBtnCss = css`
  height: 32px; padding: 0 16px;
  border-radius: 6px;
  border: 1px solid rgba(40, 184, 206, 0.25);
  background: transparent;
  color: #5a8a98;
  font-size: 13px; font-weight: 700;
  cursor: pointer; font-family: inherit;
  transition: all 0.15s;
  &:hover { background: rgba(40, 184, 206, 0.08); color: #e0f0f4; }
`

const modalLoadBtnCss = css`
  height: 32px; padding: 0 20px;
  border-radius: 6px;
  border: 1px solid rgba(40, 184, 206, 0.4);
  background: rgba(40, 184, 206, 0.2);
  color: ${GP_PRIMARY};
  font-size: 13px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.05em;
  cursor: pointer; font-family: inherit;
  transition: all 0.15s;
  &:hover { background: rgba(40, 184, 206, 0.35); border-color: ${GP_PRIMARY}; }
`
