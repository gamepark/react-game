/** @jsxImportSource @emotion/react */
import { faCircleQuestion } from '@fortawesome/free-regular-svg-icons/faCircleQuestion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MaterialGame } from '@gamepark/rules-api'
import { ComponentType, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { pointerCursorCss } from '../../css'
import { useGame, useResultText } from '../../hooks'
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
  const RulesStepsHeader = game?.rule ? rulesStepsHeaders[game.rule.id] : undefined
  return (
    <Header {...props}>
      {
        loading ? t('Game loading...')
          : RulesStepsHeader ? <RulesStepsHeader/>
            : game?.rule !== undefined ? t(`TODO: header for rule id ${game.rule.id}`)
              : GameOver ? <GameOver/> : <GameOverHeader GameOverRule={GameOverRule}/>
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
    <RulesDialog open={dialogOpen} close={() => setDialogOpen(false)} scrollbar>
      <GameOverRule/>
    </RulesDialog>
  </>
}
