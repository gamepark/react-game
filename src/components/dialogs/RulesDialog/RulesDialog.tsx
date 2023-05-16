/** @jsxImportSource @emotion/react */
import { FC, useEffect, useState } from 'react'
import { Dialog, DialogProps } from '../index'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark'
import { css, ThemeProvider } from '@emotion/react'
import { isMoveThisItem, isMoveToLocation, MaterialGame, MaterialRules, MaterialRulesMove, RulesDisplayType } from '@gamepark/rules-api'
import { MaterialRulesDialogContent } from './MaterialRulesDialogContent'
import { LocationRulesDialogContent } from './LocationRulesDialogContent'
import { MaterialDescription } from '../../material'
import { ItemLocator } from '../../../locators'
import { buttonCss } from '../../../css'

export type RulesDialogProps<Player extends number = number, MaterialType extends number = number, LocationType extends number = number> = {
  close: () => void
  game?: MaterialGame<Player, MaterialType, LocationType>
  legalMoves?: MaterialRulesMove<Player, MaterialType, LocationType>[]
  rules?: MaterialRules<Player, MaterialType, LocationType>
  material: Record<MaterialType, MaterialDescription>
  locators: Record<LocationType, ItemLocator<Player, MaterialType, LocationType>>
} & DialogProps

export const RulesDialog: FC<RulesDialogProps> = <P extends number = number, M extends number = number, L extends number = number>(
  { close, game, legalMoves = [], material, locators, rules, ...props }: RulesDialogProps<P, M, L>
) => {
  const [rulesDisplay, setRulesDisplay] = useState(game?.rulesDisplay)
  useEffect(() => {
    if (game?.rulesDisplay) setRulesDisplay(game.rulesDisplay)
  }, [game?.rulesDisplay])
  return (
    <Dialog css={rulesDialogCss} onBackdropClick={close} {...props}>
      <FontAwesomeIcon icon={faXmark} css={dialogCloseIcon} onClick={close}/>
      <ThemeProvider theme={theme => ({ ...theme, buttons: buttonCss('#002448', '#c2ebf1', '#ade4ec') })}>
        {rules && rulesDisplay?.type === RulesDisplayType.Material &&
          <MaterialRulesDialogContent rulesDisplay={rulesDisplay} material={material}
                                      legalMoves={legalMoves.filter(move => isMoveThisItem(move, rulesDisplay.itemIndex, rulesDisplay.itemType, rules))}/>
        }
        {rules && rulesDisplay?.type === RulesDisplayType.Location &&
          <LocationRulesDialogContent rulesDisplay={rulesDisplay} material={material} locator={locators[rulesDisplay.location.type]}
                                      legalMoves={legalMoves.filter(move => isMoveToLocation(move, rulesDisplay.location, rules))}/>
        }
      </ThemeProvider>
    </Dialog>
  )
}

const dialogCloseIcon = css`
  position: absolute;
  right: 0.5em;
  top: 0.3em;
  font-size: 4em;
  cursor: pointer;
  z-index: 100;
`

const rulesDialogCss = css`
  position: relative;
  background-color: #f0fbfc;
  color: #002448;
  padding: 1em;
  border-radius: 1em;
  box-shadow: 0 0 0.2em black;
  font-family: "Mulish", sans-serif;
`
