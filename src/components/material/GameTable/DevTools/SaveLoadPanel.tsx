/** @jsxImportSource @emotion/react */
import { faDownload } from '@fortawesome/free-solid-svg-icons/faDownload'
import { faFileImport } from '@fortawesome/free-solid-svg-icons/faFileImport'
import { faFloppyDisk } from '@fortawesome/free-solid-svg-icons/faFloppyDisk'
import { faPaste } from '@fortawesome/free-solid-svg-icons/faPaste'
import { faPlay } from '@fortawesome/free-solid-svg-icons/faPlay'
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FC, useCallback, useRef, useState } from 'react'
import {
  dividerCss, goBtnCss, iconBtnCss, iconBtnDangerCss, inlineRowCss, listCss, listLabelCss, listRowCss, modalBackdropCss, modalBodyCss, modalCss,
  modalFooterCss, modalHeaderCss, modalTextareaCss, pasteErrorCss, secondaryBtnCss, textInputCss, toolBtnCss, toolDescCss, toolIconCss, toolLabelCss,
  toolListCss
} from './devtools.css'

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
        <span css={toolIconCss}><FontAwesomeIcon icon={faFloppyDisk}/></span>
        <span css={toolLabelCss}>Save State</span>
        <span css={toolDescCss}>Save current game state</span>
        <div css={inlineRowCss}>
          <input
            type="text"
            placeholder="label (optional)"
            aria-label="Label of the save"
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
        <div css={listCss}>
          {saveKeys.map(key => {
            const label = getSaveLabel(key, gameName)
            return (
              <div key={key} css={listRowCss}>
                <span css={listLabelCss} title={label}>{label}</span>
                <button css={iconBtnCss} onClick={() => handleLoad(key)} title="Load" aria-label={`Load ${label}`}><FontAwesomeIcon icon={faPlay}/></button>
                <button css={iconBtnCss} onClick={() => handleDownloadSave(key)} title="Download" aria-label={`Download ${label}`}><FontAwesomeIcon icon={faDownload}/></button>
                <button css={[iconBtnCss, iconBtnDangerCss]} onClick={() => handleDelete(key)} title="Delete" aria-label={`Delete ${label}`}><FontAwesomeIcon icon={faXmark}/></button>
              </div>
            )
          })}
        </div>
      )}

      <div css={dividerCss}/>

      <div css={toolListCss}>
        {/* Import from file */}
        <button css={toolBtnCss} onClick={() => fileInputRef.current?.click()}>
          <span css={toolIconCss}><FontAwesomeIcon icon={faFileImport}/></span>
          <span css={toolLabelCss}>Import File</span>
          <span css={toolDescCss}>Load state from JSON file</span>
        </button>

        {/* Import from paste */}
        <button css={toolBtnCss} onClick={() => { setShowPasteModal(true); setPasteError(null) }}>
          <span css={toolIconCss}><FontAwesomeIcon icon={faPaste}/></span>
          <span css={toolLabelCss}>Paste State</span>
          <span css={toolDescCss}>Open editor to paste JSON</span>
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImportFile}
        style={{ display: 'none' }}
      />

      {/* Paste Modal */}
      {showPasteModal && (
        <>
          <div css={modalBackdropCss} onClick={() => { setShowPasteModal(false); setPasteError(null) }} />
          <div css={modalCss}>
            <div css={modalHeaderCss}>
              <span>Paste Game State</span>
              <button css={[iconBtnCss, iconBtnDangerCss]} aria-label="Close" onClick={() => { setShowPasteModal(false); setPasteError(null) }}><FontAwesomeIcon icon={faXmark}/></button>
            </div>
            <div css={modalBodyCss}>
              <textarea
                css={modalTextareaCss}
                placeholder='Paste your JSON game state here...'
                aria-label="Game state in JSON"
                value={importText}
                onChange={e => handlePasteChange(e.target.value)}
                spellCheck={false}
              />
              {pasteError && <div css={pasteErrorCss}>{pasteError}</div>}
            </div>
            <div css={modalFooterCss}>
              <button css={secondaryBtnCss} onClick={() => { setShowPasteModal(false); setPasteError(null) }}>Cancel</button>
              <button css={goBtnCss} onClick={handleImportPaste}>Load State</button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
