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
import { backdrop, displayBackdrop } from '../menus'
import { hide, menuBaseCss, menuFloatingButtonCss, menuFontSize } from '../menus/menuCss'
import { Chat } from './Chat'
import { History } from './History'

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
  const history = useContext(gameContext).logs
  const logEnabled = history !== undefined
  const gameMode = useSelector((state: GamePageState) => state.gameMode)
  const chatEnabled = gameMode !== GameMode.COMPETITIVE && gameMode !== GameMode.TUTORIAL
  const [tab, setTab] = useState<JournalTab | undefined>()
  const [isOpen, setOpen] = useState(false)
  useKeyDown('Enter', () => setOpen(true))
  useKeyDown('Escape', () => setOpen(false))
  useEffect(() => {
    if (!tab && gameMode) {
      setTab(chatEnabled ? JournalTab.CHAT : JournalTab.LOG)
    }
  }, [gameMode])

  if (!gameMode || (!logEnabled && !chatEnabled)) return null
  const isChatOpened = isOpen && tab === JournalTab.CHAT
  const isLogOpened = isOpen && tab === JournalTab.LOG

  return (
    <>
      <div css={[backdrop, isOpen && displayBackdrop]} onClick={() => setOpen(false)}/>
      <div css={[menuFontSize, menuBaseCss, journalMenu, !isOpen && hide]}>
        <div css={buttonContainer}>
          {chatEnabled && logEnabled && (
            <>
              <button css={[button, chatButton, isChatOpened && selected]} disabled={tab === JournalTab.CHAT} onClick={() => setTab(JournalTab.CHAT)}>
                <div>{t('Chat')}</div>
              </button>
              <button css={[button, logButton, isLogOpened && selected]} disabled={tab === JournalTab.LOG} onClick={() => setTab(JournalTab.LOG)}>
                <div>{t('History')}</div>
              </button>
            </>
          )}
        </div>
        <div css={[container, flexEnd]}>
          {chatEnabled && (
            <Chat css={[!isChatOpened && closed]} open={isChatOpened} gameId={gameId}/>
          )}
          {logEnabled && (
            <History css={[css`justify-self: flex-start`, !isLogOpened && closed]} open={isLogOpened}/>
          )}
        </div>
      </div>
      <button aria-label={t('Discuss')!} title={t('Discuss')!} css={[journalButtonCss]} onClick={() => setOpen(!isOpen)}>
        <FontAwesomeIcon icon={isOpen ? faTimes : faCommentDots} css={iconStyle}/>
      </button>
    </>
  )
}

const buttonContainer = css`
  display: flex;
  flex-direction: row;
  inset: 0;
  width: 100%;
  align-self: flex-start;
    align-items: center;
  padding-left: 3em;
  padding-top: 0.3em;
  padding-right: 0.5em;
  flex: 0;
  min-height: 2em;
`

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

const button = css`
    flex: 1;
    border: 0.01em solid #28B8CE;
    color: black;
    cursor: pointer;
    background: white;
    height: 2em;
    font-size: 0.7em;
`

const selected = css`
  background: #28B8CE;
  color: white;
`

const chatButton = css`
  border-top-left-radius: 0.5em;
  border-bottom-left-radius: 0.5em
`

const logButton = css`
  border-top-right-radius: 0.5em;
  border-bottom-right-radius: 0.5em
`

//TODO: display: none cause a lag on opening
const closed = css`
  display: none;
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
  padding: 0;
  border-bottom-right-radius: 0.5em;
  transform-origin: top left;
  left: 0;
  height: 100vh;
  height: 100dvh;
  width: 35vw;
  width: 35dvw;
  max-width: 100vw;
  justify-content: flex-end;
  display: flex;
  flex-direction: column;
`
