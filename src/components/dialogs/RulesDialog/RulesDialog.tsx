/** @jsxImportSource @emotion/react */
import { FC, useContext, useEffect, useState } from 'react'
import { Dialog, DialogProps } from '../index'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark'
import { css, ThemeProvider } from '@emotion/react'
import { MaterialMove, MaterialRules, RulesDisplayType } from '@gamepark/rules-api'
import { MaterialRulesDialogContent } from './MaterialRulesDialogContent'
import { LocationRulesDialogContent } from './LocationRulesDialogContent'
import { buttonCss } from '../../../css'
import { isMoveThisItem, isMoveToLocation } from '../../material/utils'
import { gameContext } from '../../GameProvider'
import { useLegalMoves, useRules } from '../../../hooks'

export type RulesDialogProps = {
  close: () => void
} & DialogProps

export const RulesDialog: FC<RulesDialogProps> = ({ close, ...props }: RulesDialogProps) => {
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
    <Dialog css={rulesDialogCss} onBackdropClick={close} {...props}>
      <FontAwesomeIcon icon={faXmark} css={dialogCloseIcon} onClick={close}/>
      <ThemeProvider theme={theme => ({ ...theme, buttons: buttonCss('#002448', '#c2ebf1', '#ade4ec') })}>
        {rules && rulesDisplay?.type === RulesDisplayType.Material &&
          <MaterialRulesDialogContent rulesDisplay={rulesDisplay} material={material}
                                      legalMoves={legalMoves.filter(move => rules.isMoveTrigger(move, move => isMoveThisItem(move, rulesDisplay.itemType, rulesDisplay.itemIndex)))}/>
        }
        {rules && rulesDisplay?.type === RulesDisplayType.Location &&
          <LocationRulesDialogContent rulesDisplay={rulesDisplay} material={material} locator={locators[rulesDisplay.location.type]}
                                      legalMoves={legalMoves.filter(move => rules?.isMoveTrigger(move, move => isMoveToLocation(move, rulesDisplay.location)))}/>
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
