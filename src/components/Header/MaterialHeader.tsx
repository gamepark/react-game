/** @jsxImportSource @emotion/react */
import { Header, HeaderProps } from './Header'
import { useTranslation } from 'react-i18next'
import { useGame } from '../../hooks'
import { MaterialGame } from '../../../../workshop/packages/rules-api'
import { ReactJSXElement } from '@emotion/react/types/jsx-namespace'

export type MaterialHeaderProps<RulesStep extends number = number> = {
  loading?: boolean
  rulesStepsHeaders: Record<RulesStep, () => ReactJSXElement>
  GameOver: () => ReactJSXElement
} & HeaderProps

export const MaterialHeader = <RulesStep extends number = number>(
  { loading, rulesStepsHeaders, GameOver, ...props }: MaterialHeaderProps<RulesStep>
) => {
  const { t } = useTranslation()
  const game = useGame<MaterialGame>()
  const RulesStepsHeader = game?.rule ? rulesStepsHeaders[game.rule.id] : undefined
  return (
    <Header {...props}>
      {
        loading ? t('Game loading...')
          : RulesStepsHeader ? <RulesStepsHeader/>
            : <GameOver/>
      }
    </Header>
  )
}
