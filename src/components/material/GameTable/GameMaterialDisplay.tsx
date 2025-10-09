import { css } from '@emotion/react'
import { GridBoundaries, MaterialMoveBuilder, MaterialRules } from '@gamepark/rules-api'
import { ReactNode } from 'react'
import { usePlay, useRules } from '../../../hooks'
import { MaterialRulesDialog } from '../../dialogs'
import { MaterialTutorialDisplay } from '../../tutorial/MaterialTutorialDisplay'
import { DropPreview } from './DropPreview'
import { DynamicItemsDisplay } from './DynamicItemsDisplay'
import { FocusProvider } from './focus'
import { StaticItemsDisplay } from './StaticItemsDisplay'
import { StaticLocationsDisplay } from './StaticLocationsDisplay'
import displayHelp = MaterialMoveBuilder.displayHelp

type GameMaterialDisplayProps = {
  boundaries: GridBoundaries
  children?: ReactNode
}

export const GameMaterialDisplay = ({ boundaries, children }: GameMaterialDisplayProps) => {
  const rules = useRules<MaterialRules>()
  const play = usePlay()

  if (!rules || !rules.game) return <></>
  const game = rules.game

  return <FocusProvider>
    <StaticLocationsDisplay boundaries={boundaries}/>
    <StaticItemsDisplay boundaries={boundaries}/>
    <DynamicItemsDisplay boundaries={boundaries}/>
    <div css={dropPreviewWrapper}><DropPreview boundaries={boundaries}/></div>
    <MaterialRulesDialog open={!!game?.helpDisplay} close={() => play(displayHelp(undefined), { transient: true })}/>
    {game?.tutorial && <MaterialTutorialDisplay/>}
    {children}
  </FocusProvider>
}

const dropPreviewWrapper = css`
  position: absolute;
  transform-style: preserve-3d;
`
