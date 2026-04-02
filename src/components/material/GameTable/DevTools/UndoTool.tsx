/** @jsxImportSource @emotion/react */
import { FC, useState } from 'react'
import {
  goBtnCss, inlineRowCss, numberInputCss,
  stepBtnCss, toolBtnCss, toolDescCss, toolIconCss, toolLabelCss
} from './devtools.css'

type UndoToolProps = {
  exec: (action: () => void, msg: string) => void
  g: any
}

export const UndoTool: FC<UndoToolProps> = ({ exec, g }) => {
  const [undoCount, setUndoCount] = useState(1)

  return (
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
  )
}
