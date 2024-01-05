/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { faFlag } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { GameClientAPI, GameMode, GamePageState } from '@gamepark/react-client'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useGiveUp } from '../../../hooks'
import { Dialog } from '../../dialogs'
import { menuButtonCss, menuDialogCss } from '../menuCss'

const query = new URLSearchParams(window.location.search)
const gameId = query.get('game')

export const GiveUpButton = () => {
  const { t } = useTranslation()
  const [giveUp] = useGiveUp()
  const [displayPopup, setDisplayPopup] = useState(false)
  const onGiveUp = () => {
    giveUp()
    setDisplayPopup(false)
  }
  const gameMode = useSelector<GamePageState, GameMode | undefined>(state => state.gameMode)
  const playerIsLast = useSelector<GamePageState, boolean>(state =>
    state.playerId !== undefined && state.players.length > 1
    && state.players.every(player => player.quit || player.id === state.playerId)
  )
  useEffect(() => {
    if (playerIsLast) setDisplayPopup(true)
  }, [playerIsLast])

  const onClaimVictory = () => {
    if (gameId) {
      new GameClientAPI(gameId).claimVictory()
    }
    setDisplayPopup(false)
  }

  const [displayedLongEnough, setDisplayedLongEnough] = useState(false)
  useEffect(() => {
    if (!displayPopup) {
      setDisplayedLongEnough(false)
    } else {
      const timeout = setTimeout(() => setDisplayedLongEnough(true), 200)
      return () => clearTimeout(timeout)
    }
  }, [displayPopup])

  return (
    <>
      <button css={[menuButtonCss, buttonCss]} onClick={() => setDisplayPopup(true)}>
        <FontAwesomeIcon icon={faFlag}/>
        {t('giveup')}
      </button>
      <Dialog open={displayPopup} css={[menuDialogCss, css`max-width: 90dvw;`]} onBackdropClick={() => setDisplayPopup(false)}>
        {playerIsLast ? <>
          <h2>{t('giveup.last')}</h2>
          {gameMode === GameMode.TOURNAMENT ? <>
            <p>{t('giveup.last.choice.tournament')}</p>
            <button css={[menuButtonCss, inDialogButton]} onClick={onClaimVictory} disabled={!displayedLongEnough}>
              {t('giveup.last.claim')}
            </button>
          </> : <>
            <p>{t('giveup.last.choice')}</p>
            {gameMode === GameMode.COMPETITIVE &&
              <p>{t('giveup.last.choice.competitive')}</p>
            }
            <div css={buttonLineCss}>
              <button css={[menuButtonCss, buttonCss, inDialogButton]} onClick={onGiveUp} disabled={!displayedLongEnough}>
                {t('giveup.last.cancel')}
              </button>
              <button css={[menuButtonCss, inDialogButton]} onClick={() => setDisplayPopup(false)} disabled={!displayedLongEnough}>
                {t('giveup.last.continue')}
              </button>
              <button css={[menuButtonCss, inDialogButton]} onClick={onClaimVictory} disabled={!displayedLongEnough}>
                {t('giveup.last.claim')}
              </button>
            </div>
          </>
          }
        </> : <>
          <h2>{t('giveup.title')}</h2>
          <p>{t('giveup.robot')}</p>
          <p>{gameMode === GameMode.FRIENDLY ? t('giveup.friendly') : t('giveup.competitive')} </p>
          <p>{gameMode === GameMode.TOURNAMENT && t('giveup.tournament')}</p>
          <div css={buttonLineCss}>
            <button css={[menuButtonCss, inDialogButton]} onClick={() => setDisplayPopup(false)} disabled={!displayedLongEnough}>{t('Cancel')}</button>
            <button css={[menuButtonCss, buttonCss, inDialogButton]} onClick={onGiveUp} disabled={!displayedLongEnough}>
              <FontAwesomeIcon icon={faFlag}/>
              {t('giveup')}
            </button>
          </div>
        </>}
      </Dialog>
    </>
  )
}

const buttonCss = css`
  color: darkred;
  border-color: darkred;

  &:focus, &:hover {
    background: #ffd7d7;
  }

  &:active {
    background: #ffbebe;
  }
`

const buttonLineCss = css`
  margin-top: 1em;
  display: flex;
  justify-content: space-between;
`

const inDialogButton = css`
  margin: 0;
`