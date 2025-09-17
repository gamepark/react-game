import { faUndoAlt } from '@fortawesome/free-solid-svg-icons/faUndoAlt'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useTranslation } from 'react-i18next'
import { useUndo } from '../../../hooks'
import { menuButtonCss } from '../menuCss'

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