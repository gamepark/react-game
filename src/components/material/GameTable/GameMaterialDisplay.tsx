/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { MaterialMoveBuilder, MaterialRules } from '@gamepark/rules-api'
import { PropsWithChildren } from 'react'
import { usePlay, useRules } from '../../../hooks'
import { MaterialRulesDialog } from '../../dialogs'
import { MaterialTutorialDisplay } from '../../tutorial/MaterialTutorialDisplay'
import { DropPreview } from './DropPreview'
import { DynamicItemsDisplay } from './DynamicItemsDisplay'
import { FocusProvider } from './focus'
import { StaticItemsDisplay } from './StaticItemsDisplay'
import { StaticLocationsDisplay } from './StaticLocationsDisplay'
import displayHelp = MaterialMoveBuilder.displayHelp

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
    <StaticLocationsDisplay css={position}/>
    <StaticItemsDisplay css={position}/>
    <DynamicItemsDisplay css={position}/>
    <DropPreview css={position}/>
    <MaterialRulesDialog open={!!game?.helpDisplay} close={() => play(displayHelp(undefined), { transient: true })}/>
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
