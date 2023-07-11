/** @jsxImportSource @emotion/react */
import { FC, useContext, useEffect, useState } from 'react'
import { RulesDialog, RulesDialogProps } from '../index'
import { MaterialRules, RulesDisplayType } from '@gamepark/rules-api'
import { MaterialRulesDialogContent } from './MaterialRulesDialogContent'
import { LocationRulesDialogContent } from './LocationRulesDialogContent'
import { gameContext } from '../../GameProvider'
import { useRules } from '../../../hooks'

export const MaterialRulesDialog: FC<RulesDialogProps> = (props: RulesDialogProps) => {
  const { material, locators } = useContext(gameContext)
  const rules = useRules<MaterialRules>()
  const [rulesDisplay, setRulesDisplay] = useState(rules?.game.rulesDisplay)
  useEffect(() => {
    if (rules?.game.rulesDisplay) setRulesDisplay(game.rulesDisplay)
  }, [rules?.game.rulesDisplay])

  if (!material || !locators || !rules) return null
  const game = rules.game

  return (
    <RulesDialog {...props}>
      {rules && rulesDisplay?.type === RulesDisplayType.Material &&
        <MaterialRulesDialogContent rulesDisplay={rulesDisplay}/>
      }
      {rules && rulesDisplay?.type === RulesDisplayType.Location &&
        <LocationRulesDialogContent rulesDisplay={rulesDisplay} material={material} locator={locators[rulesDisplay.location.type]}/>
      }
    </RulesDialog>
  )
}
