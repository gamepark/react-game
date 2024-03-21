/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { GamePageState } from '@gamepark/react-client'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { HistoryEntry } from './HistoryEntry'

export const GameOverHistory = () => {
  const { t } = useTranslation()
  const gameOver = useSelector((state: GamePageState) => state.gameOver)
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