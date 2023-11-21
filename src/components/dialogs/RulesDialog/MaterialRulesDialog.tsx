/** @jsxImportSource @emotion/react */
import { FC } from 'react'
import { RulesDialog, RulesDialogProps } from '../index'
import { MaterialGame, HelpDisplayType } from '@gamepark/rules-api'
import { MaterialRulesDialogContent } from './MaterialRulesDialogContent'
import { LocationRulesDialogContent } from './LocationRulesDialogContent'
import { useGame } from '../../../hooks'

export const MaterialRulesDialog: FC<RulesDialogProps> = (props: RulesDialogProps) => {
  const game = useGame<MaterialGame>()
  if (!game?.helpDisplay) return null
  return (
    <RulesDialog {...props}>
      {game.helpDisplay.type === HelpDisplayType.Material &&
        <MaterialRulesDialogContent helpDisplay={game.helpDisplay}/>
      }
      {game.helpDisplay.type === HelpDisplayType.Location &&
        <LocationRulesDialogContent helpDisplay={game.helpDisplay}/>
      }
    </RulesDialog>
  )
}
