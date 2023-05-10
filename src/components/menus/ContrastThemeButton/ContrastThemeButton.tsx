/** @jsxImportSource @emotion/react */
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { menuButtonCss } from '@gamepark/react-client'
import { useTranslation } from 'react-i18next'
import { ContrastTheme } from '../../../hooks'

export function ContrastThemeButton({ theme }: { theme: ContrastTheme }) {
  const { t } = useTranslation()
  return (
    <button css={menuButtonCss} onClick={theme.toggleContrast}>
      <FontAwesomeIcon icon={theme.light ? faMoon : faSun}/>
      {theme.light ? t('Dark mode') : t('Light mode')}
    </button>
  )
}