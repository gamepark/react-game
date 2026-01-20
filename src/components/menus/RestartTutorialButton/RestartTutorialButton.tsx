import { faGraduationCap } from '@fortawesome/free-solid-svg-icons/faGraduationCap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { gameContext } from '../../GameProvider'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { menuButtonCss } from '../menuCss'

export const RestartTutorialButton = () => {
  const { t } = useTranslation('common')
  const game = useContext(gameContext)?.game
  if (!game) throw new Error('Cannot use TutorialButton outside a GameProvider context')

  const onClick = () => {
    localStorage.removeItem(game)
    window.location.reload()
  }

  return (
    <button css={menuButtonCss} onClick={onClick}>
      <FontAwesomeIcon icon={faGraduationCap}/>
      {t('Restart the tutorial')}
    </button>
  )
}