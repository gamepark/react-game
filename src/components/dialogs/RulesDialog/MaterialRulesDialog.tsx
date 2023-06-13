/** @jsxImportSource @emotion/react */
import { FC, useContext, useEffect, useState } from 'react'
import { RulesDialog, RulesDialogProps } from '../index'
import { MaterialMove, MaterialRules, RulesDisplayType } from '@gamepark/rules-api'
import { MaterialRulesDialogContent } from './MaterialRulesDialogContent'
import { LocationRulesDialogContent } from './LocationRulesDialogContent'
import { isMoveThisItem, isMoveToLocation } from '../../material/utils'
import { gameContext } from '../../GameProvider'
import { useLegalMoves, useRules } from '../../../hooks'

export const MaterialRulesDialog: FC<RulesDialogProps> = (props: RulesDialogProps) => {
  const { material, locators } = useContext(gameContext)
  const rules = useRules<MaterialRules>()
  const legalMoves = useLegalMoves<MaterialMove>()
  const [rulesDisplay, setRulesDisplay] = useState(rules?.game.rulesDisplay)
  useEffect(() => {
    if (rules?.game.rulesDisplay) setRulesDisplay(game.rulesDisplay)
  }, [rules?.game.rulesDisplay])

  if (!material || !locators || !rules) return null
  const game = rules.game

  return (
    <RulesDialog {...props}>
      {rules && rulesDisplay?.type === RulesDisplayType.Material &&
        <MaterialRulesDialogContent rulesDisplay={rulesDisplay} material={material}
                                    legalMoves={legalMoves.filter(move => rules.isMoveTrigger(move, move => isMoveThisItem(move, rulesDisplay.itemType, rulesDisplay.itemIndex)))}/>
      }
      {rules && rulesDisplay?.type === RulesDisplayType.Location &&
        <LocationRulesDialogContent rulesDisplay={rulesDisplay} material={material} locator={locators[rulesDisplay.location.type]}
                                    legalMoves={legalMoves.filter(move => rules?.isMoveTrigger(move, move => isMoveToLocation(move, rulesDisplay.location)))}/>
      }
    </RulesDialog>
  )
}
