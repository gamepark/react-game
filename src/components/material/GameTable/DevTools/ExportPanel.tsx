/** @jsxImportSource @emotion/react */
import { faCopy } from '@fortawesome/free-solid-svg-icons/faCopy'
import { faDownload } from '@fortawesome/free-solid-svg-icons/faDownload'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FC, useCallback } from 'react'
import { toolBtnCss, toolDescCss, toolIconCss, toolLabelCss, toolListCss } from './devtools.css'

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
    <div css={toolListCss}>
      {/* Download State */}
      <button css={toolBtnCss} onClick={handleDownloadState}>
        <span css={toolIconCss}><FontAwesomeIcon icon={faDownload}/></span>
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
        <span css={toolIconCss}><FontAwesomeIcon icon={faCopy}/></span>
        <span css={toolLabelCss}>Copy LocalStorage</span>
        <span css={toolDescCss}>Copy "{gameName}" key to clipboard</span>
      </button>
    </div>
  )
}
