/** @jsxImportSource @emotion/react */
import { css, useTheme } from '@emotion/react'
import { faChessPawn, faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  addStylesheetUrl,
  ContrastThemeButton,
  gameContext,
  GameMode,
  GamePageState,
  GamePointIcon,
  isContrastTheme,
  LogoIcon,
  menuBaseCss,
  menuFloatingButtonCss,
  menuFontSize,
  NavButton,
  PLATFORM_URI
} from '@gamepark/react-client'
import { GameSpeed } from '@gamepark/rules-api'
import fscreen from 'fscreen'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { ResultDialog } from '../../dialogs'
import { TimeStatsButton } from '../TimeStatsButton'
import { ResultButton, ResultPopButton } from '../Result'
import { FullscreenButton, FullscreenPopButton } from '../Fullscreen'
import { GiveUpButton } from '../GiveUpButton'
import { EjectPlayerButton, EjectPlayerDialog, EjectPlayerPopButton } from '../EjectPlayer'
import { RestartTutorialButton } from '../RestartTutorialButton'
import { SoundButton } from '../SoundButton'
import { UndoButton, UndoPopButton } from '../UndoButton'
import { Chat } from '../../Chat'

export function Menu() {
  const { t } = useTranslation()
  const [isOpen, setOpen] = useState(false)
  const game = useContext(gameContext)?.game ?? ''
  const query = new URLSearchParams(window.location.search)
  const gameId = query.get('game')
  const locale = query.get('locale') || 'en'
  const gameMode = useSelector((state: GamePageState) => state.gameMode)
  const options = useSelector((state: GamePageState) => state.options)
  const playerId = useSelector((state: GamePageState) => state.playerId)
  const gameOver = useSelector((state: GamePageState) => state.gameOver)
  const tournament = useSelector((state: GamePageState) => state.tournament)
  const couldEject = !gameOver && (playerId !== undefined || tournament?.signedUp === true) && options?.speed === GameSpeed.RealTime
  const couldUndo = !gameOver && playerId !== undefined
  const canGiveUp = !gameOver && playerId !== undefined && gameMode !== GameMode.TUTORIAL
  const canPlayAgain = gameOver && playerId !== undefined && gameMode === GameMode.COMPETITIVE
  const goToRanking = gameOver && gameMode === GameMode.COMPETITIVE
  const chatEnable = gameMode === GameMode.FRIENDLY || gameMode === GameMode.TOURNAMENT
  const [ejectPlayerDialogOpen, setEjectPlayerDialogOpen] = useState(false)
  const [resultDialogOpen, setResultDialogOpen] = useState(false)
  const [resultDialogAutoOpen, setResultDialogAutoOpen] = useState(false)
  useEffect(() => {
    if (gameOver === false) setResultDialogAutoOpen(true)
  }, [gameOver])
  useEffect(() => {
    if (gameOver && resultDialogAutoOpen) {
      const timeout = setTimeout(() => setResultDialogOpen(true), 10000)
      return () => clearTimeout(timeout)
    }
  }, [gameOver, resultDialogAutoOpen])
  useEffect(() => {
    if (resultDialogOpen) setResultDialogAutoOpen(false)
  }, [resultDialogOpen])
  const theme = useTheme()
  return (
    <>
      <div css={[backdrop, isOpen && displayBackdrop]} onClick={() => setOpen(false)}/>
      {couldEject && <EjectPlayerPopButton onClick={() => setEjectPlayerDialogOpen(true)}/>}
      {couldUndo && <UndoPopButton/>}
      {gameOver && gameMode !== GameMode.TUTORIAL && <ResultPopButton onClick={() => setResultDialogOpen(true)}/>}
      {fscreen.fullscreenEnabled && <FullscreenPopButton/>}
      <div css={[menuFontSize, menuBaseCss, menuCss, !isOpen && hide]}>
        <h2 css={titleCss}>{t('Menu')}</h2>
        {fscreen.fullscreenEnabled && <FullscreenButton/>}
        <SoundButton/>
        {isContrastTheme(theme) && <ContrastThemeButton theme={theme}/>}
        {couldUndo && <UndoButton/>}
        {canGiveUp && <GiveUpButton/>}
        {couldEject && <EjectPlayerButton onClick={() => setEjectPlayerDialogOpen(true)}/>}
        {options?.speed === GameSpeed.RealTime && <TimeStatsButton/>}
        {gameMode === GameMode.TUTORIAL && <RestartTutorialButton/>}
        <NavButton url={`${PLATFORM_URI}/${locale}/board-games/${game}`}><LogoIcon css={buttonLogoIcon}/>{t('Back to Game Park')}</NavButton>
        {gameOver && gameMode !== GameMode.TUTORIAL && <ResultButton onClick={() => setResultDialogOpen(true)}/>}
        {canPlayAgain &&
          <NavButton url={`${PLATFORM_URI}/${locale}/board-games/${game}/play`}><FontAwesomeIcon icon={faChessPawn}/>{t('Play again')}</NavButton>
        }
        {goToRanking &&
          <NavButton url={`${PLATFORM_URI}/${locale}/board-games/${game}/ranking`}>
            <GamePointIcon css={gamePointIconStyle}/>{t('See overall ranking')}
          </NavButton>
        }
      </div>
      <button aria-label={t('Menu')!} title={t('Menu')!} css={mainButtonCss} onClick={() => setOpen(!isOpen)}>
        {isOpen ? <FontAwesomeIcon icon={faTimes} css={iconStyle}/> : <LogoIcon fill="white"/>}
      </button>
      {couldEject && <EjectPlayerDialog open={ejectPlayerDialogOpen} close={() => setEjectPlayerDialogOpen(false)}/>}
      {gameOver && gameMode !== GameMode.TUTORIAL && <ResultDialog open={resultDialogOpen}
                                                                   openDialog={() => setResultDialogOpen(true)}
                                                                   close={() => setResultDialogOpen(false)}/>}
      {chatEnable && gameId && <Chat gameId={gameId}/>}
    </>
  )
}

addStylesheetUrl('https://fonts.googleapis.com/css2?family=Mulish:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap')

const mainButtonCss = css`
  ${menuFloatingButtonCss};
  z-index: 1000;
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

export const backdrop = css`
  position: fixed;
  width: 100vw;
  height: 100vw;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.5s;
  pointer-events: none;
  z-index: 950;
`

export const displayBackdrop = css`
  opacity: 1;
  pointer-events: auto;
`

const menuCss = css`
  right: 0;
  padding: 0.5em 0.75em;
  border-bottom-left-radius: 0.5em;
  transform-origin: top right;
`

const titleCss = css`
  font-size: 1.5em;
  margin: 0 2em 1em 0;
`

const iconStyle = css`
  color: white;
  font-size: 1.5em;
`

const buttonLogoIcon = css`
  width: 1em;
  height: 1em;
  margin-bottom: -0.1em;
  fill: #28B8CE;
`

const gamePointIconStyle = css`
  width: 1em;
  height: 1em;
  margin-bottom: -0.1em;
`

const hide = css`
  transform: scale(0);
`
