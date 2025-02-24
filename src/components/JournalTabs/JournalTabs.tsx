/** @jsxImportSource @emotion/react */

import { css } from '@emotion/react'
import { faCommentDots } from '@fortawesome/free-regular-svg-icons/faCommentDots'
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { GameMode, GamePageState } from '@gamepark/react-client'
import { FC, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useKeyDown } from '../../hooks'
import { gameContext } from '../GameProvider'
import { displayBackdrop } from '../menus'
import { hide, menuBaseCss, menuFloatingButtonCss, menuFontSize } from '../menus/menuCss'
import { JournalPreview } from './JournalPreview'

export type JournalTabsProps = {
  gameId?: string
}

enum JournalTab {
  LOG = 1,
  CHAT
}

export const JournalTabs: FC<JournalTabsProps> = (props) => {
  const { t } = useTranslation()
  const { gameId } = props
  const history = useContext(gameContext).MaterialHistory
  const logEnabled = history !== undefined
  const gameMode = useSelector((state: GamePageState) => state.gameMode)
  const chatEnabled = gameMode !== GameMode.COMPETITIVE && gameMode !== GameMode.TUTORIAL
  const [tab, setTab] = useState<JournalTab | undefined>(JournalTab.LOG)
  const [isOpen, setOpen] = useState(true)
  useKeyDown('Enter', () => setOpen(true))
  //useKeyDown('Escape', () => setOpen(false))
  useEffect(() => {
    if (!tab && gameMode) {
      setTab(chatEnabled ? JournalTab.CHAT : JournalTab.LOG)
    }
  }, [gameMode])

  if (!gameMode || (!logEnabled && !chatEnabled)) return null
  //const isChatOpened = isOpen && tab === JournalTab.CHAT
  //const isLogOpened = isOpen && tab === JournalTab.LOG

  return (
    <>
      <div css={[isOpen && displayBackdrop]} onClick={() => setOpen(false)}/>
      <div css={[menuFontSize, menuBaseCss, journalMenu, !isOpen && hide]}>
        <div css={[container, flexEnd]}>
          <JournalPreview gameId={gameId} />
        </div>
      </div>
      <button aria-label={t('Discuss')!} title={t('Discuss')!} css={[journalButtonCss]} onClick={() => setOpen(!isOpen)}>
        <FontAwesomeIcon icon={isOpen ? faTimes : faCommentDots} css={iconStyle}/>
      </button>
    </>
  )
}

const container = css`
  width: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden
`

const flexEnd = css`
  justify-content: flex-end;
`

const journalButtonCss = css`
  ${menuFloatingButtonCss};
  z-index: 1000;
  top: 0;
  left: 0;
  border-bottom-right-radius: 25%;
  border-bottom-left-radius: 0;
  background: #28B8CE;
  height: 2.5em;
  width: 2.5em;

  &:focus, &:hover {
    background: #24a5b9;
  }

  &:active {
    background: #2092a3;
  }

  svg {
    position: relative;
    width: 70%;
    height: 60%;
  }
`

const iconStyle = css`
  color: white;
  font-size: 1.5em;
  @media (max-height: 300px) {
    font-size: 20px;
  }
`


const journalMenu = css`
    background: transparent !important;
    padding: 1em;
    box-shadow: unset !important;
  border-bottom-right-radius: 0.5em;
  transform-origin: top left;
  left: 0;
    top: 0;
    bottom: unset !important;
    position: absolute;
  height: 50vh;
  height: 50dvh;
  width: 35vw;
  width: 35dvw;
  max-width: 100vw;
  justify-content: flex-end;
  display: flex;
  flex-direction: column;
`
