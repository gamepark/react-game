/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { faUndoAlt } from '@fortawesome/free-solid-svg-icons/faUndoAlt'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useTranslation } from 'react-i18next'
import { useUndo } from '../../../hooks'
import { MenuPopButton } from '../Menu/MenuPopButton'

export const UndoPopButton = () => {
  const { t } = useTranslation()
  const [undo, canUndo] = useUndo()
  const canUndoLastMove = canUndo()

  return (
    <MenuPopButton pop={canUndoLastMove} onClick={() => undo()} css={style} title={t('Undo my last move')!}>
      <FontAwesomeIcon icon={faUndoAlt}/>
    </MenuPopButton>
  )
}

const style = css`
  background: white;
  color: #28b8ce;

  &:focus, &:hover {
    background: #f0fbfc;
  }

  &:active {
    background: #dbf5f8;
  }
`