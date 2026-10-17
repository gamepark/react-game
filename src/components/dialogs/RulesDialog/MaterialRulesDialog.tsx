import { css } from '@emotion/react'
import { HelpDisplay, HelpDisplayType, MaterialGame } from '@gamepark/rules-api'
import { FC, useEffect, useState } from 'react'
import { useGame } from '../../../hooks'
import { RulesDialog, RulesDialogProps } from '../index'
import { LocationRulesDialogContent } from './LocationRulesDialogContent'
import { MaterialRulesDialogContent } from './MaterialRulesDialogContent'
import { RulesHelpDialogContent } from './RulesHelpDialogContent'

export const MaterialRulesDialog: FC<RulesDialogProps> = (props: RulesDialogProps) => {
  const game = useGame<MaterialGame>()
  const [lastHelpDisplay, setLastHelpDisplay] = useState<HelpDisplay | undefined>(game?.helpDisplay)

  useEffect(() => {
    if (game?.helpDisplay) {
      setLastHelpDisplay(game.helpDisplay)
    }
  }, [game?.helpDisplay])

  const helpDisplay = game?.helpDisplay ?? lastHelpDisplay
  if (!helpDisplay) return null

  return (
    <RulesDialog {...props} css={inlineImg}>
      {helpDisplay.type === HelpDisplayType.Material &&
        <MaterialRulesDialogContent helpDisplay={helpDisplay}/>
      }
      {helpDisplay.type === HelpDisplayType.Location &&
        <LocationRulesDialogContent helpDisplay={helpDisplay}/>
      }
      {helpDisplay.type === HelpDisplayType.Rules &&
        <RulesHelpDialogContent helpDisplay={helpDisplay}/>
      }
    </RulesDialog>
  )
}

// The dialog class and the text tags are wrapped in :where(), so this default has the specificity of a bare img and
// a game styles its own inline icons with a plain class
const inlineImg = css`
  :where(& p, & li, & h2, & h3, & h4) img {
    height: 1em;
    position: relative;
    top: 0.1em;
  }
`
