import { css } from '@emotion/react'
import { HelpDisplayType, MaterialGame } from '@gamepark/rules-api'
import { FC } from 'react'
import { useGame } from '../../../hooks'
import { RulesDialog, RulesDialogProps } from '../index'
import { LocationRulesDialogContent } from './LocationRulesDialogContent'
import { MaterialRulesDialogContent } from './MaterialRulesDialogContent'
import { RulesHelpDialogContent } from './RulesHelpDialogContent'

export const MaterialRulesDialog: FC<RulesDialogProps> = (props: RulesDialogProps) => {
  const game = useGame<MaterialGame>()
  if (!game?.helpDisplay) return null
  return (
    <RulesDialog {...props} css={inlineImg}>
      {game.helpDisplay.type === HelpDisplayType.Material &&
        <MaterialRulesDialogContent helpDisplay={game.helpDisplay}/>
      }
      {game.helpDisplay.type === HelpDisplayType.Location &&
        <LocationRulesDialogContent helpDisplay={game.helpDisplay}/>
      }
      {game.helpDisplay.type === HelpDisplayType.Rules &&
        <RulesHelpDialogContent helpDisplay={game.helpDisplay}/>
      }
    </RulesDialog>
  )
}

const inlineImg = css`
  p img, li img, h2 img, h3 img, h4 img {
    height: 1em;
    position: relative;
    top: 0.1em;
  }
`
