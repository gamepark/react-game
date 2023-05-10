/** @jsxImportSource @emotion/react */
import { faVolumeMute, faVolumeUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { gameContext, useSoundControls } from '@gamepark/react-client'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { menuButtonCss } from '../menuCss'

export const SoundButton = () => {
  const { t } = useTranslation()
  const { mute, unmute, muted } = useSoundControls()
  const hasSounds = useContext(gameContext)?.hasSounds
  if (!hasSounds) return null
  return (
    <button css={menuButtonCss} onClick={() => muted ? unmute() : mute()}>
      <FontAwesomeIcon icon={muted ? faVolumeMute : faVolumeUp}/>
      {muted ? t('Enable sound') : t('Mute sound')}
    </button>
  )
}