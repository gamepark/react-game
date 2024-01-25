/** @jsxImportSource @emotion/react */

import { css } from '@emotion/react'
import { faComments } from '@fortawesome/free-regular-svg-icons'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { GameMode, GamePageState } from '@gamepark/react-client'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useKeyDown } from '../../hooks'
import { backdrop, displayBackdrop } from '../menus'
import { floatingButtonCss, hide, menuBaseCss } from '../menus/menuCss'
import { ActionLog } from './ActionLog'
import { Chat } from './Chat'

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
  const [tab, setTab] = useState<JournalTab>(JournalTab.CHAT)
  const [isOpen, setOpen] = useState(false)
  useKeyDown('Enter', () => setOpen(true))
  useKeyDown('Escape', () => setOpen(false))

  const gameMode = useSelector((state: GamePageState) => state.gameMode)
  const chatEnabled = gameMode !== GameMode.COMPETITIVE && gameMode !== GameMode.TUTORIAL
  const logEnabled = true
  if (!logEnabled && !chatEnabled) return null
  const isChatOpened = isOpen && tab === JournalTab.CHAT
  const isLogOpened = isOpen && tab === JournalTab.LOG

  return (
    <>
      <div css={[backdrop, isOpen && displayBackdrop]} onClick={() => setOpen(false)}/>
      <div css={[menuBaseCss, journalMenu, !isOpen && hide]}>
        <div css={css`display: flex;
          flex-direction: row;
          inset: 0;
          height: 7.5dvh;
          width: 100%;
          padding: 0.5em 1em 0.5em 4em;`}>
          <button css={[button, chatButton, isChatOpened && selected]} disabled={tab === JournalTab.CHAT} onClick={() => setTab(JournalTab.CHAT)}>Chat</button>
          <button css={[button, logButton, isLogOpened && selected]} disabled={tab === JournalTab.LOG} onClick={() => setTab(JournalTab.LOG)}>Journal</button>
        </div>
        <div css={css`height: 92.5dvh; width: 100%; display: flex; flex-direction: column; align-items: flex-end`}>
          {chatEnabled && <Chat css={[!isChatOpened && closed]} open={isChatOpened} gameId={gameId}/>}
          {logEnabled && <ActionLog css={[!isLogOpened && closed]} open={isLogOpened}/>}
        </div>
      </div>
      <button aria-label={t('Discuss')!} title={t('Discuss')!} css={[floatingButtonCss, journalButtonCss]} onClick={() => setOpen(!isOpen)}>
        <FontAwesomeIcon icon={isOpen ? faTimes : faComments} css={iconStyle}/>
      </button>
    </>
  )
}

const button = css`
  flex: 1;
  border: 0.01em solid #28B8CE;
  color: black;
  cursor: pointer;
  font-weight: bold;
  background: white;
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

const closed = css`
  display: none;
`

const journalButtonCss = css`
  z-index: 1000;
  top: 0;
  left: 0;
  border-bottom-right-radius: 25%;
  background: #28B8CE;
  height: 2.5em;
  width: 2.5em;
  min-width: 38px;
  min-height: 38px;

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
  font-size: 16px;
  left: 0;
  height: 100dvh;
  width: 40dvw;
  max-width: 100vw;
  border-bottom-right-radius: 0.5em;
  transform-origin: top left;
  justify-content: flex-end;
  display: flex;
  flex-direction: column;
`