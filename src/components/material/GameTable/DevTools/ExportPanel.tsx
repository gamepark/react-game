/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react'
import { FC, useCallback } from 'react'

const GP_PRIMARY = '#28B8CE'

type ExportPanelProps = {
  gameName: string
  doFlash: (msg: string) => void
}

export const ExportPanel: FC<ExportPanelProps> = ({ gameName, doFlash }) => {
  const handleDownloadState = useCallback(() => {
    const raw = localStorage.getItem(gameName)
    if (!raw) { doFlash('No game state in localStorage'); return }
    const blob = new Blob([raw], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${gameName}-state-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
    doFlash('State downloaded')
  }, [gameName, doFlash])

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      doFlash(`${label} copied!`)
    } catch {
      doFlash('Copy failed')
    }
  }, [doFlash])

  return (
    <>
      {/* Download State */}
      <button css={toolBtnCss} onClick={handleDownloadState}>
        <span css={toolIconCss}>{'\u2913'}</span>
        <span css={toolLabelCss}>Download State</span>
        <span css={toolDescCss}>Save state as .json file</span>
      </button>

      {/* Copy LocalStorage */}
      <button css={toolBtnCss}
        onClick={() => {
          const raw = localStorage.getItem(gameName)
          if (raw) {
            void copyToClipboard(raw, `${gameName} state`)
          } else {
            doFlash(`No "${gameName}" key in localStorage`)
          }
        }}>
        <span css={toolIconCss}>{'\u29C9'}</span>
        <span css={toolLabelCss}>Copy LocalStorage</span>
        <span css={toolDescCss}>Copy "{gameName}" key to clipboard</span>
      </button>
    </>
  )
}

// ── Styles ──

const toolReveal = keyframes`
  from { opacity: 0; transform: translateX(-0.375em); }
  to { opacity: 1; transform: translateX(0); }
`

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

const toolIconCss = css`
  grid-row: 1 / -1;
  color: ${GP_PRIMARY};
  display: flex; align-items: center; justify-content: center;
  width: 1.75em; height: 1.75em;
  border-radius: 0.375em;
  background: rgba(40, 184, 206, 0.08);
`

const toolLabelCss = css`
  font-weight: 700; color: #e0f0f4; line-height: 1.2;
`

const toolDescCss = css`
  color: #5a8a98; line-height: 1.2;
`
