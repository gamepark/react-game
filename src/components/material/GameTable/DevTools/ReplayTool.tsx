/** @jsxImportSource @emotion/react */
import { faBackwardFast } from '@fortawesome/free-solid-svg-icons/faBackwardFast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FC, useContext } from 'react'
import { gameContext } from '../../../GameProvider/GameContext'
import { goBtnCss, toolBtnCss, toolDescCss, toolEndCss, toolIconCss, toolInlineCss, toolLabelCss } from './devtools.css'
import { replayGame } from './replayGame'

type ReplayToolProps = {
  exec: (action: () => void, msg: string) => void
}

export const ReplayTool: FC<ReplayToolProps> = ({ exec }) => {
  const gameName = useContext(gameContext)?.game
  return (
    <div css={[toolBtnCss, toolInlineCss]}>
      <span css={toolIconCss}><FontAwesomeIcon icon={faBackwardFast}/></span>
      <span css={toolLabelCss}>Replay This Game</span>
      <span css={toolDescCss}>Same setup, all moves removed</span>
      <div css={toolEndCss}>
        <button css={goBtnCss} onClick={() => exec(() => {
          if (gameName && replayGame(gameName)) window.location.reload()
        }, 'Replaying the same setup')}>Go</button>
      </div>
    </div>
  )
}
