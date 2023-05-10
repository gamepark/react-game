/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { faUserSlash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MenuPopButton } from '@gamepark/react-client'
import { HTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import useOpponentWithMaxTime from '../../../hooks/useOpponentWithMaxTime'
import { useUndo } from '../../../hooks'

export function EjectPlayerPopButton(props: HTMLAttributes<HTMLButtonElement>) {
  const {t} = useTranslation()
  const opponentWithNegativeTime = useOpponentWithMaxTime(0)
  const [, canUndo] = useUndo()
  const canUndoLastMove = canUndo()

  return (
    <MenuPopButton pop={opponentWithNegativeTime !== undefined} popPosition={canUndoLastMove ? 2 : 1}
                   css={style} title={t('Eject player')!} {...props}>
      <FontAwesomeIcon icon={faUserSlash}/>
    </MenuPopButton>
  )
}

const style = css`
  background: white;
  color: darkred;

  &:focus, &:hover {
    background: #ffd7d7;
  }

  &:active {
    background: #ffbebe;
  }
`