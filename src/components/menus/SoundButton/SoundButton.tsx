import { faVolumeMute } from '@fortawesome/free-solid-svg-icons/faVolumeMute'
import { faVolumeUp } from '@fortawesome/free-solid-svg-icons/faVolumeUp'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useSoundControls } from '@gamepark/react-client'
import { useTranslation } from 'react-i18next'
import { menuButtonCss } from '../menuCss'

export const SoundButton = () => {
  const { t } = useTranslation('common')
  const { mute, unmute, muted } = useSoundControls()
  return (
    <button css={menuButtonCss} onClick={() => muted ? unmute() : mute()}>
      <FontAwesomeIcon icon={muted ? faVolumeMute : faVolumeUp}/>
      {muted ? t('Enable sound') : t('Mute sound')}
    </button>
  )
}
