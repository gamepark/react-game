import { FC } from 'react'
import { ItemMoveType, Location, MaterialGame, MaterialItem, MaterialMove, MaterialRulesDisplay, MoveKind } from '@gamepark/rules-api'
import { ItemContext, MaterialContext } from '../../locators'

export type StockDescription<P extends number = number, L extends number = number> = {
  location: Location<P, L>
  id?: any
}

export type MaterialRulesProps<P extends number = number, M extends number = number, L extends number = number> = {
  closeDialog: () => void
} & Omit<MaterialRulesDisplay<P, M, L>, 'type'>

export type ComponentSize = {
  width: number
  height: number
}

export type ComponentCommonProps = {
  highlight?: boolean
  playDown?: boolean
}

export abstract class MaterialDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any> {
  abstract rules: FC<MaterialRulesProps<P, M, L>>
  item?: MaterialItem<P, L>

  getItems(_game: MaterialGame<P, M, L>, _player?: P): MaterialItem<P, L>[] {
    return this.item ? [this.item] : []
  }

  stock?: StockDescription<P, L>

  getStocks(_context: MaterialContext<P, M, L>): StockDescription<P, L>[] {
    return this.stock ? [this.stock] : []
  }

  locations: Location<P, L>[] = []

  getLocations(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): Location<P, L>[] {
    return this.locations
  }

  isActivable<P extends number = number, M extends number = number, L extends number = number>(
    move: MaterialMove<P, M, L>, itemType: M, itemIndex: number
  ): boolean {
    return move.kind === MoveKind.ItemMove
      && move.itemType === itemType
      && (move.type === ItemMoveType.Move || move.type === ItemMoveType.Delete)
      && move.itemIndex === itemIndex
  }

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

  thickness = 0.05

  getThickness(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): number {
    return this.thickness
  }
}
