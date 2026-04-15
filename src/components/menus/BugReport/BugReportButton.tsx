import { useTheme } from '@emotion/react'
import { faBug } from '@fortawesome/free-solid-svg-icons/faBug'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { menuButtonCss, paletteMenuButtonCss } from '../menuCss'
import { BugReportDialog } from './BugReportDialog'

export const BugReportButton = () => {
  const { t } = useTranslation('common')
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button css={[menuButtonCss, paletteMenuButtonCss, theme.menu?.button]} onClick={() => setOpen(true)}>
        <FontAwesomeIcon icon={faBug}/>
        {t('bug.report', 'Report a bug')}
      </button>
      <BugReportDialog open={open} onClose={() => setOpen(false)}/>
    </>
  )
}
