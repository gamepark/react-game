/** @jsxImportSource @emotion/react */
import { faRotateLeft } from '@fortawesome/free-solid-svg-icons/faRotateLeft'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FC, useState } from 'react'
import {
  goBtnCss, numberInputCss, stepBtnCss, toolBtnCss, toolDescCss, toolEndCss, toolIconCss, toolInlineCss, toolLabelCss
} from './devtools.css'

type UndoToolProps = {
  exec: (action: () => void, msg: string) => void
  g: any
}

export const UndoTool: FC<UndoToolProps> = ({ exec, g }) => {
  const [undoCount, setUndoCount] = useState(1)

  return (
    <div css={[toolBtnCss, toolInlineCss]}>
      <span css={toolIconCss}><FontAwesomeIcon icon={faRotateLeft}/></span>
      <span css={toolLabelCss}>Undo</span>
      <span css={toolDescCss}>Revert N moves</span>
      <div css={toolEndCss}>
        <button css={stepBtnCss} aria-label="Fewer moves" onClick={() => setUndoCount(c => Math.max(1, c - 1))}>-</button>
        <input type="number" min={1} max={999} value={undoCount} aria-label="Moves to revert"
          onChange={e => setUndoCount(Math.max(1, parseInt(e.target.value) || 1))}
          css={numberInputCss} />
        <button css={stepBtnCss} aria-label="More moves" onClick={() => setUndoCount(c => c + 1)}>+</button>
        <button css={goBtnCss}
          onClick={() => {
            // game.undo fails when asked more moves than were played
            const quantity = Math.min(undoCount, g?.moves?.length ?? undoCount)
            exec(() => g.undo(quantity), quantity ? `Undo ${quantity} move${quantity > 1 ? 's' : ''}` : 'No move to undo')
          }}>
          Go
        </button>
      </div>
    </div>
  )
}
