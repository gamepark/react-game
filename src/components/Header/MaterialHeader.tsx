/** @jsxImportSource @emotion/react */
import { faCircleQuestion } from '@fortawesome/free-regular-svg-icons/faCircleQuestion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MaterialGame } from '@gamepark/rules-api'
import { ComponentType, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { GamePageState } from '../../../../workshop/packages/react-client'
import { pointerCursorCss } from '../../css'
import { useGame, usePlayerId, usePlayerName, useResultText } from '../../hooks'
import { RulesDialog } from '../dialogs'
import { Header, HeaderProps } from './Header'

export type MaterialHeaderProps<RulesStep extends number = number> = {
  loading?: boolean
  rulesStepsHeaders: Partial<Record<RulesStep, ComponentType>>
  GameOver?: ComponentType
  GameOverRule?: ComponentType
} & HeaderProps

export const MaterialHeader = <RulesStep extends number = number>(
  { loading, rulesStepsHeaders, GameOver, GameOverRule, ...props }: MaterialHeaderProps<RulesStep>
) => {
  const { t } = useTranslation()
  const game = useGame<MaterialGame>()
  const cancelled = useSelector<GamePageState, boolean>(state => state.players.every(player => player.quit))
  const gameOver = useSelector<GamePageState, boolean>(state => !!state.gameOver) || !game?.rule
  const victoryClaim = gameOver && game?.rule
  const RulesStepsHeader = game?.rule ? rulesStepsHeaders[game.rule.id] : undefined
  return (
    <Header {...props}>
      {
        (loading || !game) ? t('Game loading...')
          : gameOver ? (
            cancelled ? t('game.cancelled')
              : victoryClaim ? <ShowVictoryClaim/>
                : GameOver ? <GameOver/>
                  : <GameOverHeader GameOverRule={GameOverRule}/>
          ) : RulesStepsHeader ? <RulesStepsHeader/>
            : t(`TODO: header for rule id ${game?.rule?.id}`)
      }
    </Header>
  )
}

const GameOverHeader = ({ GameOverRule }: { GameOverRule?: ComponentType }) => {
  const resultText = useResultText()
  const [dialogOpen, setDialogOpen] = useState(false)

  if (!GameOverRule) return <>{resultText}</>
  return <>
    <span>{resultText}&nbsp;<FontAwesomeIcon icon={faCircleQuestion} onClick={() => setDialogOpen(true)} css={pointerCursorCss}/></span>
    <RulesDialog open={dialogOpen} close={() => setDialogOpen(false)}>
      <GameOverRule/>
    </RulesDialog>
  </>
}

const ShowVictoryClaim = () => {
  const { t } = useTranslation()
  const winnerId = useSelector<GamePageState>(state => state.players.find(p => !p.quit)?.id)
  const player = usePlayerName(winnerId)
  const playerId = usePlayerId()
  if (playerId === winnerId) {
    return <>{t('game.over.concede.victory')}</>
  } else {
    return <>{t('game.over.concede', { player })}</>
  }
}
