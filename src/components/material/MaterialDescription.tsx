/** @jsxImportSource @emotion/react */
import {
  DeleteItem,
  isDeleteItem,
  isMoveItem,
  isRoll,
  isSelectItem,
  Location,
  MaterialItem,
  MaterialMove,
  MaterialHelpDisplay,
  MoveItem
} from '@gamepark/rules-api'
import equal from 'fast-deep-equal'
import { ComponentType, FC, HTMLAttributes } from 'react'
import { ItemContext, MaterialContext } from '../../locators'

export type MaterialHelpProps<P extends number = number, M extends number = number, L extends number = number> = {
  closeDialog: () => void
} & Omit<MaterialHelpDisplay<P, M, L>, 'type'>

export type ComponentSize = {
  width: number
  height: number
}

export type MaterialContentProps<P extends number = number, M extends number = number, L extends number = number, ItemId = any> = {
  itemId: ItemId,
  context: MaterialContext<P, M, L>,
  highlight?: boolean
  playDown?: boolean
} & HTMLAttributes<HTMLElement>

export abstract class MaterialDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any> {
  help?: ComponentType<MaterialHelpProps<P, M, L>>
  abstract content: FC<MaterialContentProps<P, M, L, ItemId>>

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

  canDrag(move: MaterialMove<P, M, L>, context: ItemContext<P, M, L>): boolean {

    if (isMoveItem(move)) {
      return move.location?.type !== undefined && move.itemType === context.type && move.itemIndex === context.index && this.canDragToMove(move, context)
    } else if (isDeleteItem(move)) {
      return move.itemType === context.type && move.itemIndex === context.index && this.canDragToDelete(move, context)
    } else {
      return false
    }
  }

  protected canDragToMove(move: MoveItem<P, M, L>, { type, index, rules }: ItemContext<P, M, L>): boolean {
    const { rotation, ...actualLocation } = rules.material(type).getItem(index)?.location!
    const { rotation: nextRotation, ...nextLocation } = move.location
    return !equal(actualLocation, nextLocation)
  }

  protected canDragToDelete(_move: DeleteItem<M>, _context: ItemContext<P, M, L>): boolean {
    return this.stockLocation !== undefined
  }

  canLongClick(move: MaterialMove<P, M, L>, { type, index }: ItemContext<P, M, L>): boolean {
    return (isMoveItem(move) || isDeleteItem(move) || isRoll(move)) && move.itemType === type && move.itemIndex === index
  }

  canShortClick(move: MaterialMove<P, M, L>, { type, index }: ItemContext<P, M, L>): boolean {
    return isSelectItem(move) && move.itemType === type && move.itemIndex === index
  }

  height?: number
  width?: number
  ratio?: number
  borderRadius?: number

  getSize(_itemId: ItemId, _context: MaterialContext<P, M, L>): ComponentSize {
    if (this.width && this.height) return { width: this.width, height: this.height }
    if (this.ratio && this.width) return { width: this.width, height: this.width / this.ratio }
    if (this.ratio && this.height) return { width: this.height * this.ratio, height: this.height }
    throw new Error('You must implement 2 of "width", "height" & "ratio" in any Material description')
  }

  getBorderRadius(_itemId: ItemId, _context: MaterialContext<P, M, L>): number | undefined {
    return this.borderRadius
  }

  abstract getImages(): string[]

  thickness = 0.05

  getThickness(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): number {
    return this.thickness
  }

  getRotations(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): string[] {
    return []
  }
}

export type MaterialDescriptionRecord<P extends number = number, M extends number = number, L extends number = number> = Record<M, MaterialDescription<P, M, L>>


