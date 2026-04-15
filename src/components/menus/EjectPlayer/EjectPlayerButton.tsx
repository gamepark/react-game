import { useTheme } from '@emotion/react'
import { faUserSlash } from '@fortawesome/free-solid-svg-icons/faUserSlash'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { HTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { menuButtonCss, paletteDangerButtonCss, paletteMenuButtonCss } from '../menuCss'
import { useOpponentWithMaxTime } from '../../../hooks'

export const EjectPlayerButton = (props: HTMLAttributes<HTMLButtonElement>) => {
  const { t } = useTranslation('common')
  const theme = useTheme()
  const opponentWithNegativeTime = useOpponentWithMaxTime(0)
  return (
    <button css={[menuButtonCss, paletteMenuButtonCss, paletteDangerButtonCss, theme.menu?.button]} disabled={!opponentWithNegativeTime} {...props}>
      <FontAwesomeIcon icon={faUserSlash}/>
      {t('Eject player')}
    </button>
  )
}
