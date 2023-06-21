import { FC, ReactNode } from 'react'
import { Location, MaterialGame, MaterialItem, MaterialMove } from '@gamepark/rules-api'

export type StockDescription<P extends number = number, L extends number = number> = {
  location: Location<P, L>
}

export type MaterialRulesProps<P extends number = number, M extends number = number, L extends number = number> = {
  item: Partial<MaterialItem<P, L>>
  legalMoves: MaterialMove<P, M, L>[]
  close: () => void
}

export type MaterialLocationsFunction<ItemId = any> = (itemId?: ItemId, legalMoves?: MaterialMove[]) => ReactNode | undefined


//const query = new URLSearchParams(window.location.search)
//const locale = query.get('locale') || 'en'

export type ComponentSize = {
  width: number
  height: number
}

export abstract class MaterialDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any> {
  abstract rules: FC<MaterialRulesProps<P, M, L>>
  items?: (game: MaterialGame<P, M, L>, player?: P) => MaterialItem<P, L>[]
  stock?: StockDescription<P, L>
  getLocations?: MaterialLocationsFunction<ItemId>

  height?: number
  width?: number
  ratio?: number

  getSize(_itemId: ItemId): ComponentSize {
    if (this.width && this.height) return { width: this.width, height: this.height }
    if (this.ratio && this.width) return { width: this.width, height: this.width / this.ratio }
    if (this.ratio && this.height) return { width: this.height * this.ratio, height: this.height }
    throw new Error('You must implement 2 of "width", "height" & "ratio" in any Material description')
  }

  abstract getImages(): string[]
}
