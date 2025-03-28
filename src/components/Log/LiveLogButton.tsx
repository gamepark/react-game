/** @jsxImportSource @emotion/react */
import { faBell } from '@fortawesome/free-solid-svg-icons/faBell'
import { faBellSlash } from '@fortawesome/free-solid-svg-icons/faBellSlash'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useLogControls } from '@gamepark/react-client/dist/Log'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { gameContext } from '../GameProvider'
import { menuButtonCss } from '../menus/menuCss'

export const LiveLogButton = () => {
  const { t } = useTranslation()
  const { start, stop, stopped } = useLogControls()
  const hasLogs = useContext(gameContext)?.logs
  if (!hasLogs) return null
  return (
    <button css={menuButtonCss} onClick={() => stopped ? start() : stop()}>
      <FontAwesomeIcon icon={stopped ? faBellSlash : faBell}/>
      {stopped ? t('Enable live history') : t('Disable live history')}
    </button>
  )
}
