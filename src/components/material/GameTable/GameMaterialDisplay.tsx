/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { closeHelpDisplay, MaterialRules } from '@gamepark/rules-api'
import { PropsWithChildren } from 'react'
import { usePlay, useRules } from '../../../hooks'
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
  const play = usePlay()

  if (!rules || !rules.game) return <></>
  const game = rules.game

  const position = defaultPosition(left, top)
  return <FocusProvider>
    <StaticItemsDisplay css={position}/>
    <DynamicItemsDisplay css={position}/>
    <StaticLocationsDisplay css={position}/>
    <MaterialRulesDialog open={!!game?.helpDisplay} close={() => play(closeHelpDisplay, { local: true })}/>
    {game?.tutorialStep !== undefined && <MaterialTutorialDisplay/>}
    {children}
  </FocusProvider>
}

const defaultPosition = (left: number, top: number) => css`
  position: absolute;
  left: ${left}em;
  top: ${top}em;
  transform-style: preserve-3d;
`
