/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { faFlag } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { GameMode, GamePageState } from '@gamepark/react-client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Dialog } from '../../dialogs'
import { menuButtonCss, menuDialogCss } from '../menuCss'
import { useGiveUp } from '../../../hooks'

export const GiveUpButton = () => {
  const { t } = useTranslation()
  const [giveUp] = useGiveUp()
  const [displayPopup, setDisplayPopup] = useState(false)
  const onGiveUp = () => {
    giveUp()
    setDisplayPopup(false)
  }
  const gameMode = useSelector<GamePageState>(state => state.gameMode)

  return (
    <>
      <button css={[menuButtonCss, buttonCss]} onClick={() => setDisplayPopup(true)}>
        <FontAwesomeIcon icon={faFlag}/>
        {t('Give up')}
      </button>
      <Dialog open={displayPopup} css={menuDialogCss} onBackdropClick={() => setDisplayPopup(false)}>
        <h2>{t('Give up the game')}</h2>
        <p>{t('give-up.dialog.p1')}</p>
        <p>{gameMode === GameMode.FRIENDLY ? t('give-up.dialog.p3') : t('give-up.dialog.p2')} </p>
        <p>{gameMode === GameMode.TOURNAMENT && t('give-up.dialog.p4')}</p>
        <div css={buttonLineCss}>
          <button css={[menuButtonCss, inDialogButton]} onClick={() => setDisplayPopup(false)}>{t('Cancel')}</button>
          <button css={[menuButtonCss, buttonCss, inDialogButton]} onClick={onGiveUp}>
            <FontAwesomeIcon icon={faFlag}/>
            {t('Give up')}
          </button>
        </div>
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