/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { faCompress } from '@fortawesome/free-solid-svg-icons/faCompress'
import { faExpand } from '@fortawesome/free-solid-svg-icons/faExpand'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFullscreen } from '../../../hooks'
import { MenuPopButton } from '../Menu/MenuPopButton'

export const FullscreenPopButton = () => {
  const { t } = useTranslation()
  const [pop, setPop] = useState(true)

  useEffect(() => {
    setTimeout(() => setPop(false), 5000)
  }, [])

  const { fullscreen, toggleFullscreen } = useFullscreen()

  return (
    <MenuPopButton pop={pop} onClick={toggleFullscreen} css={style} title={fullscreen ? t('Leave full screen')! : t('Go to full screen')!}>
      <FontAwesomeIcon icon={fullscreen ? faCompress : faExpand}/>
    </MenuPopButton>
  )
}

const style = css`
  background: white;
  color: #28b8ce;

  &:focus, &:hover {
    background: #f0fbfc;
  }

  &:active {
    background: #dbf5f8;
  }
`
