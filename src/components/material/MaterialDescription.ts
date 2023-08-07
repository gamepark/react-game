import { FC } from 'react'
import { isDeleteItem, isMoveItem, Location, MaterialItem, MaterialMove, MaterialRulesDisplay } from '@gamepark/rules-api'
import { ItemContext, MaterialContext } from '../../locators'

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

  staticItem?: MaterialItem<P, L>
  staticItems: MaterialItem<P, L>[] = []

  getStaticItems(_context: MaterialContext<P, M, L>): MaterialItem<P, L>[] {
    return this.staticItem ? [this.staticItem] : this.staticItems
  }

  stockLocation?: Location<P, L>

  getStockLocation(_item: MaterialItem<P, L>, _context: MaterialContext<P, M, L>): Location<P, L> | undefined {
    return this.stockLocation
  }

  location?: Location<P, L>
  locations: Location<P, L>[] = []

  getLocations(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): Location<P, L>[] {
    return this.location ? [this.location] : this.locations
  }

  canDrag(move: MaterialMove<P, M, L>, { type, index }: ItemContext<P, M, L>): boolean {
    return (
      (isMoveItem(move) && move.position.location !== undefined)
      || (isDeleteItem(move) && this.stockLocation !== undefined)
    ) && move.itemType === type && move.itemIndex === index
  }

  canLongClick(move: MaterialMove<P, M, L>, { type, index }: ItemContext<P, M, L>): boolean {
    return (isMoveItem(move) || isDeleteItem(move)) && move.itemType === type && move.itemIndex === index
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
