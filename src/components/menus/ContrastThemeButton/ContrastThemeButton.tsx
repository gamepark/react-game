/** @jsxImportSource @emotion/react */
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useTranslation } from 'react-i18next'
import { ContrastTheme } from '../../../hooks'
import { menuButtonCss } from '../menuCss'

export const ContrastThemeButton = ({ theme }: { theme: ContrastTheme }) => {
  const { t } = useTranslation()
  return (
    <button css={menuButtonCss} onClick={theme.toggleContrast}>
      <FontAwesomeIcon icon={theme.light ? faMoon : faSun}/>
      {theme.light ? t('Dark mode') : t('Light mode')}
    </button>
  )
}