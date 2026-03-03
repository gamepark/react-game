import { useTheme } from '@emotion/react'
import { faCompress } from '@fortawesome/free-solid-svg-icons/faCompress'
import { faExpand } from '@fortawesome/free-solid-svg-icons/faExpand'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useTranslation } from 'react-i18next'
import { useFullscreen } from '../../../hooks'
import { menuButtonCss, paletteMenuButtonCss } from '../menuCss'

export const FullscreenButton = () => {
  const { t } = useTranslation('common')
  const theme = useTheme()
  const { fullscreen, toggleFullscreen } = useFullscreen()

  return (
    <button css={[menuButtonCss, paletteMenuButtonCss, theme.menu?.button]} onClick={toggleFullscreen}>
      <FontAwesomeIcon icon={fullscreen ? faCompress : faExpand}/>
      {fullscreen ? t('Leave full screen') : t('Go to full screen')}
    </button>
  )
}
