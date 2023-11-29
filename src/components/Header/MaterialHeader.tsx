/** @jsxImportSource @emotion/react */
import { faCircleQuestion } from '@fortawesome/free-regular-svg-icons/faCircleQuestion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { GamePageState } from '@gamepark/react-client'
import { displayRulesHelp, MaterialGame } from '@gamepark/rules-api'
import { ComponentType, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { pointerCursorCss } from '../../css'
import { useGame, usePlay, usePlayerId, usePlayerName, useResultText } from '../../hooks'
import { RulesDialog } from '../dialogs'
import { gameContext } from '../GameProvider'
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
  const play = usePlay()
  const context = useContext(gameContext)
  const cancelled = useSelector<GamePageState, boolean>(state => state.players.every(player => player.quit))
  const gameOver = useSelector<GamePageState, boolean>(state =>
    state.actions?.every(action => !action.animation) === true && state.gameOver === true
  ) || !game?.rule
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
          ) : RulesStepsHeader ? <>
              <RulesStepsHeader/>
              {context.rulesHelp?.hasOwnProperty(game.rule!.id) && <>
                &nbsp;<FontAwesomeIcon icon={faCircleQuestion} onClick={() => play(displayRulesHelp(game.rule!.id), { local: true })} css={pointerCursorCss}/>
              </>}
            </>
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
