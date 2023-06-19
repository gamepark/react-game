import { BoardMaterialDescription } from './Board'
import { CardMaterialDescription } from './Card'
import { ReactNode } from 'react'
import { ItemMove, Location, MaterialGame, MaterialItem, MaterialMove } from '@gamepark/rules-api'
import { TokenMaterialDescription } from './Token'
import { ItemProp } from './Items'

export type MaterialDescription<P extends number = number, M extends number = number, L extends number = number>
  = BoardMaterialDescription<P, M, L> | CardMaterialDescription<P, M, L> | TokenMaterialDescription<P, M, L>

export type StockDescription<P extends number = number, L extends number = number> = {
  location: Location<P, L>
}

export type MaterialRulesProps<P extends number = number, M extends number = number, L extends number = number> = {
  item: Partial<MaterialItem<P, L>>
  legalMoves: ItemMove<P, M, L>[]
  close: () => void
}

export type MaterialLocationsFunction<ItemId = any> = (itemId?: ItemId, legalMoves?: MaterialMove[]) => ReactNode | undefined


export abstract class CommonMaterialDescription<P extends number = number, M extends number = number, L extends number = number> {
  abstract rules: (props: MaterialRulesProps<P, M, L>) => ReactNode
  items?: (game: MaterialGame<P, M, L>, player?: P) => MaterialItem<P, L>[]
  stock?: StockDescription<P, L>
  isHidden?: (item: MaterialItem<P, L>) => boolean

  abstract getImages(): string[]
}

export const extractImages = <ItemId = any>(faces?: ItemProp<any, ItemId>): string[] => {
  if (!faces || typeof faces === 'function') return []
  if (typeof faces === 'object') {
    return Object.values(faces) as string[]
  } else {
    return [faces]
  }
}
