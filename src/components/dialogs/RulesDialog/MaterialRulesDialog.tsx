/** @jsxImportSource @emotion/react */
import { FC } from 'react'
import { RulesDialog, RulesDialogProps } from '../index'
import { MaterialGame, RulesDisplayType } from '@gamepark/rules-api'
import { MaterialRulesDialogContent } from './MaterialRulesDialogContent'
import { LocationRulesDialogContent } from './LocationRulesDialogContent'
import { useGame } from '../../../hooks'

export const MaterialRulesDialog: FC<RulesDialogProps> = (props: RulesDialogProps) => {
  const game = useGame<MaterialGame>()
  if (!game?.rulesDisplay) return null
  return (
    <RulesDialog {...props}>
      {game.rulesDisplay.type === RulesDisplayType.Material &&
        <MaterialRulesDialogContent rulesDisplay={game.rulesDisplay}/>
      }
      {game.rulesDisplay.type === RulesDisplayType.Location &&
        <LocationRulesDialogContent rulesDisplay={game.rulesDisplay}/>
      }
    </RulesDialog>
  )
}
