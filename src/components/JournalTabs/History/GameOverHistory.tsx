import { css } from '@emotion/react'
import { useTranslation } from 'react-i18next'
import { useRules } from '../../../hooks'
import { HistoryEntry } from './HistoryEntry'

export const GameOverHistory = () => {
  const { t } = useTranslation()
  const gameOver = useRules()?.isOver()
  if (!gameOver) return null
  return (
    <HistoryEntry>
      <div css={gameOverStyle}>{t('history.game.over')}</div>
    </HistoryEntry>
  )
}

const gameOverStyle = css`
  color: grey;
  text-align: center;
  font-style: italic
`