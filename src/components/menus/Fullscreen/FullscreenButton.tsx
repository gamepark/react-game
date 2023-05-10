/** @jsxImportSource @emotion/react */
import { faCompress, faExpand } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useTranslation } from 'react-i18next'
import { useFullscreen } from '../../../hooks'
import { menuButtonCss } from '../menuCss'

export const FullscreenButton = () => {
  const { t } = useTranslation()
  const { fullscreen, toggleFullscreen } = useFullscreen()

  return (
    <button css={menuButtonCss} onClick={toggleFullscreen}>
      <FontAwesomeIcon icon={fullscreen ? faCompress : faExpand}/>
      {fullscreen ? t('Leave full screen') : t('Go to full screen')}
    </button>
  )
}
