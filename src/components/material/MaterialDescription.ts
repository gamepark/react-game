import { BoardMaterialDescription } from './Board'
import { CardMaterialDescription } from './Card'
import { StaticMaterialItem } from './Items'
import { ReactNode } from 'react'
import { MaterialGame, MaterialItem, MaterialMove, MaterialRulesMove } from '@gamepark/rules-api'
import { TokenMaterialDescription } from './Token'

export type MaterialDescription<P extends number = number, M extends number = number, L extends number = number>
  = BoardMaterialDescription<P, M, L> | CardMaterialDescription<P, M, L> | TokenMaterialDescription<P, M, L>

export type CommonMaterialDescription<P extends number = number, M extends number = number, L extends number = number> = {
  rules: (props: MaterialRulesProps<P, M, L>) => ReactNode
  items?: (game: MaterialGame<P, M, L>, player?: P) => StaticMaterialItem[]
}

export type MaterialRulesProps<P extends number = number, M extends number = number, L extends number = number> = {
  item: Partial<MaterialItem<P, L>>
  legalMoves: MaterialMove<P, M, L>[]
  close: () => void
}

export type MaterialLocationsFunction<ItemId = number> = (itemId?: ItemId, legalMoves?: MaterialRulesMove[]) => ReactNode | undefined
