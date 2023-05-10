/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { faUserSlash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { HTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import useOpponentWithMaxTime from '../../../hooks/useOpponentWithMaxTime'
import { menuButtonCss } from '../menuCss'

export const EjectPlayerButton = (props: HTMLAttributes<HTMLButtonElement>) => {
  const { t } = useTranslation()
  const opponentWithNegativeTime = useOpponentWithMaxTime(0)
  return (
    <button css={[menuButtonCss, buttonCss]} disabled={!opponentWithNegativeTime} {...props}>
      <FontAwesomeIcon icon={faUserSlash}/>
      {t('Eject player')}
    </button>
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

  &:disabled {
    color: #555555;
    border-color: #555555;
    background: transparent;
    cursor: auto;
  }
`