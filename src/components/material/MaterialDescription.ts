import { BoardMaterialDescription } from './Board'
import { CardMaterialDescription } from './Card'
import { ReactNode } from 'react'
import { ItemMove, Location, MaterialGame, MaterialItem, MaterialMove } from '@gamepark/rules-api'
import { TokenMaterialDescription } from './Token'

export type MaterialDescription<P extends number = number, M extends number = number, L extends number = number>
  = BoardMaterialDescription<P, M, L> | CardMaterialDescription<P, M, L> | TokenMaterialDescription<P, M, L>

export type StockDescription<P extends number = number, L extends number = number> = {
  location: Location<P, L>
}

export type CommonMaterialDescription<P extends number = number, M extends number = number, L extends number = number> = {
  rules: (props: MaterialRulesProps<P, M, L>) => ReactNode
  items?: (game: MaterialGame<P, M, L>, player?: P) => MaterialItem<P, L>[]
  stock?: StockDescription<P, L>
  isHidden?: (item: any) => boolean
}

export type MaterialRulesProps<P extends number = number, M extends number = number, L extends number = number> = {
  item: Partial<MaterialItem<P, L>>
  legalMoves: ItemMove<P, M, L>[]
  close: () => void
}

export type MaterialLocationsFunction<ItemId = number> = (itemId?: ItemId, legalMoves?: MaterialMove[]) => ReactNode | undefined
