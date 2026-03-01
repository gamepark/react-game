import { css, useTheme } from '@emotion/react'
import { faExpand } from '@fortawesome/free-solid-svg-icons/faExpand'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import fscreen from 'fscreen'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogProps } from '../../dialogs'
import { useFullscreen } from '../../../hooks'
import { menuButtonCss, menuDialogCss, paletteMenuButtonCss } from '../menuCss'

export const FullscreenDialog = (props: Omit<DialogProps, 'open'>) => {
  const { t } = useTranslation('common')
  const theme = useTheme()
  const { fullscreen, toggleFullscreen } = useFullscreen()
  const [open, setOpen] = useState(true)
  const themedButtonCss = [menuButtonCss, paletteMenuButtonCss(theme), theme.menu?.button]
  return (
    <Dialog open={open} css={[dialogCss, menuDialogCss]} backdropCss={backdropCss} {...props}>
      <h2>{t('Flip your screen')}</h2>
      <p>{t('fs.dialog.p1')}</p>
      {fscreen.fullscreenEnabled && !fullscreen && <p>{t('fs.dialog.p2')}</p>}
      <div css={buttonLineCss}>
        <button css={[...themedButtonCss, inDialogButton]} onClick={() => setOpen(false)}>{t('Close')}</button>
        {fscreen.fullscreenEnabled && !fullscreen &&
          <button css={[...themedButtonCss, inDialogButton, marginLeft]} onClick={() => toggleFullscreen()}>
            <FontAwesomeIcon icon={faExpand}/>
            {t('Go to full screen')}
          </button>
        }
      </div>
    </Dialog>
  )
}

const dialogCss = css`
  font-size: 1rem;
  margin: 1em;
`

const backdropCss = css`
  @media (min-aspect-ratio: 1/1) {
    display: none;
  }
`

const buttonLineCss = css`
  margin-top: 1em;
  display: flex;
  justify-content: space-between;
`

const inDialogButton = css`
  margin: 0;
`

const marginLeft = css`
  margin-left: 1em;
`
