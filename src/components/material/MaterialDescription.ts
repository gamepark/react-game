import { BoardMaterialDescription } from './Board'
import { CardMaterialDescription } from './Card'
import { StaticMaterialItem } from './Items'
import { ReactNode } from 'react'
import { MaterialItem, MaterialMove, MaterialRulesMove } from '@gamepark/rules-api'
import { TokenMaterialDescription } from './Token'

export type MaterialDescription = BoardMaterialDescription | CardMaterialDescription | TokenMaterialDescription

export type CommonMaterialDescription = {
  rules: (props: MaterialRulesProps) => ReactNode
  items?: StaticMaterialItem[]
}

export type MaterialRulesProps = {
  item: Partial<MaterialItem>
  legalMoves: MaterialMove[]
  close: () => void
}

export type MaterialLocationsFunction<ItemId = number> = (itemId?: ItemId, legalMoves?: MaterialRulesMove[]) => ReactNode | undefined
