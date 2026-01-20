import { css } from '@emotion/react'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { HistoryEntry } from './HistoryEntry'

export const StartGameHistory: FC = () => {
  const { t } = useTranslation('common')
  return (
    <HistoryEntry>
      <div css={startOfGameStyle}>{t('history.game.start')}</div>
    </HistoryEntry>
  )
}

const startOfGameStyle = css`
  color: grey;
  text-align: center;
  font-style: italic
`