/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { MaterialRules } from '@gamepark/rules-api'
import { PropsWithChildren } from 'react'
import { useRules } from '../../../hooks'
import { useCloseHelpDialog } from '../../../hooks/useCloseHelpDialog'
import { MaterialRulesDialog } from '../../dialogs'
import { MaterialTutorialDisplay } from '../../tutorial/MaterialTutorialDisplay'
import { DynamicItemsDisplay } from './DynamicItemsDisplay'
import { FocusProvider } from './focus'
import { StaticItemsDisplay } from './StaticItemsDisplay'
import { StaticLocationsDisplay } from './StaticLocationsDisplay'

type GameMaterialDisplayProps = PropsWithChildren<{
  left: number
  top: number
}>

export const GameMaterialDisplay = ({ left, top, children }: GameMaterialDisplayProps) => {
  const rules = useRules<MaterialRules>()
  const closeHelpDialog = useCloseHelpDialog()

  if (!rules || !rules.game) return <></>
  const game = rules.game

  const position = defaultPosition(left, top)
  return <FocusProvider>
    <StaticLocationsDisplay css={position}/>
    <StaticItemsDisplay css={position}/>
    <DynamicItemsDisplay css={position}/>
    <MaterialRulesDialog open={!!game?.helpDisplay} close={closeHelpDialog}/>
    {game?.tutorial && <MaterialTutorialDisplay/>}
    {children}
  </FocusProvider>
}

const defaultPosition = (left: number, top: number) => css`
  position: absolute;
  left: ${left}em;
  top: ${top}em;
  transform-style: preserve-3d;
`
