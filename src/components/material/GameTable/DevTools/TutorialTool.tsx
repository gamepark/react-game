/** @jsxImportSource @emotion/react */
import { faBookOpen } from '@fortawesome/free-solid-svg-icons/faBookOpen'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FC } from 'react'
import { toolBtnCss, toolDescCss, toolIconCss, toolLabelCss } from './devtools.css'

type TutorialToolProps = {
  exec: (action: () => void, msg: string) => void
  g: any
}

export const TutorialTool: FC<TutorialToolProps> = ({ exec, g }) => (
  <button css={toolBtnCss}
    onClick={() => exec(() => g.tutorial(), 'Tutorial started')}>
    <span css={toolIconCss}><FontAwesomeIcon icon={faBookOpen}/></span>
    <span css={toolLabelCss}>Tutorial</span>
    <span css={toolDescCss}>Start tutorial mode</span>
  </button>
)
