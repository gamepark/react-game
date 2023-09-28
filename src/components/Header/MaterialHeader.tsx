/** @jsxImportSource @emotion/react */
import { Header, HeaderProps } from './Header'
import { useTranslation } from 'react-i18next'
import { useGame, useResultText } from '../../hooks'
import { ComponentType, useState } from 'react'
import { MaterialGame } from '@gamepark/rules-api'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleQuestion } from '@fortawesome/free-regular-svg-icons/faCircleQuestion'
import { pointerCursorCss } from '../../css'
import { RulesDialog } from '../dialogs'
import Scrollbars from 'react-custom-scrollbars-2'
import { css } from '@emotion/react'

export type MaterialHeaderProps<RulesStep extends number = number> = {
  loading?: boolean
  rulesStepsHeaders: Record<RulesStep, ComponentType>
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
    <RulesDialog open={dialogOpen} close={() => setDialogOpen(false)}>
      <Scrollbars autoHeight css={scrollableContainer}>
        <GameOverRule/>
      </Scrollbars>
    </RulesDialog>
  </>
}

const scrollableContainer = css`
  max-height: calc(90vh - 6em) !important;

  > div {
    max-height: calc(90vh - 6em) !important;

    // trick to avoid very thin bar on some resolutions with react-custom-scrollbars-2
    scrollbar-width: none;
    -ms-overflow-style: none;

    ::-webkit-scrollbar {
      width: 0;
      height: 0;
    }
  }
`