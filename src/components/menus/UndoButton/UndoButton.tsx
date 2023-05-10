/** @jsxImportSource @emotion/react */
import { faUndoAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { menuButtonCss } from '@gamepark/react-client'
import { useTranslation } from 'react-i18next'
import { useUndo } from '../../../hooks'

export const UndoButton = () => {
  const { t } = useTranslation()
  const [undo, canUndo] = useUndo()
  const canUndoLastMove = canUndo()

  return (
    <button css={menuButtonCss} disabled={!canUndoLastMove} onClick={() => undo()}>
      <FontAwesomeIcon icon={faUndoAlt}/>
      {t('Undo my last move')}
    </button>
  )
}