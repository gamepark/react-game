/** @jsxImportSource @emotion/react */
import {
  Coordinates,
  DisplayedItem,
  isCreateItem,
  isDeleteItem,
  isMoveItem,
  ItemMove,
  Location,
  Material,
  MaterialGame,
  MaterialItem,
  XYCoordinates
} from '@gamepark/rules-api'
import { ItemAnimationContext, LocationDescription, MaterialDescription } from '../components'
import equal from 'fast-deep-equal'
import { Animation } from '@gamepark/react-client'

export abstract class ItemLocator<P extends number = number, M extends number = number, L extends number = number> {
  parentItemType?: M
  rotationUnit = 'deg'
  limit?: number
  locationDescription?: LocationDescription

  hide(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): boolean {
    return this.limit ? this.getItemIndex(item, context) >= this.limit : false
  }

  transformItem(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string[] {
    return ['translate(-50%, -50%)', ...this.transformItemLocation(item, context)]
  }

  protected transformItemLocation(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string[] {
    return this.transformParentItemLocation(item.location, context).concat(...this.transformOwnItemLocation(item, context))
  }

  protected transformOwnItemLocation(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string[] {
    return [this.getTranslate3d(item, context), ...this.getRotations(item, context)]
  }

  getTranslate3d(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string {
    let { x, y, z } = this.getPosition(item, context)
    const parentMaterial = this.parentItemType ? context.material[this.parentItemType] : undefined
    if (parentMaterial) {
      const positionOnParent = this.getPositionOnParent(item.location, context)
      const { width, height } = parentMaterial.getSize(this.getParentItemId(item.location))
      x += width * (positionOnParent.x - 50) / 100
      y += height * (positionOnParent.y - 50) / 100
    }
    return `translate3d(${x}em, ${y}em, ${z}em)`
  }

  getParentItemId(_location: Location<P, L>): number | undefined {
    return undefined
  }

  position: XYCoordinates = { x: 0, y: 0 }

  /**
   * Place the center of the item on the screen
   *
   * @param item Item being placed
   * @param context Placement context (type of item, and index if item has a quantity to display)
   * @return The delta coordinates in em of the center of the item from the center of their parent (or the screen)
   */
  getPosition(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): Coordinates {
    return { ...this.position, z: context.material[context.type].getThickness(item, context) }
  }

  positionOnParent: XYCoordinates = { x: 0, y: 0 }

  /**
   * Place the center of the item in the plan of their parent item. This is ignored if "parentItemType" is undefined.
   * Examples: {x: 0, y: 0} places the center of the item in the top-left corner of the parent item
   * {x: 50, y: 50} centers the item in the parent item.
   *
   * @param _location Location of the item or area inside the parent item
   * @param _context THe material game context
   * @return {x, y} with "x" as a percentage from the parent's width, "y" a percentage of the height
   */
  getPositionOnParent(_location: Location<P, L>, _context: MaterialContext<P, M, L>): XYCoordinates {
    return this.positionOnParent
  }

  getRotations(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string[] {
    const rotations = []
    const rotation = this.getRotation?.(item, context)
    if (rotation) {
      rotations.push(`rotateZ(${rotation}${this.rotationUnit})`)
    }
    if (this.isHidden(item, context)) {
      rotations.push(`rotateY(180deg)`)
    }
    return rotations
  }

  getRotation?(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): number

  hidden = false

  isHidden(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): boolean {
    return this.hidden
  }

  protected transformParentItemLocation(location: Location<P, L>, context: ItemContext<P, M, L>): string[] {
    if (!this.parentItemType) return []
    const { game, player, material, locators } = context
    const parentMaterial = material[this.parentItemType]
    if (location.parent !== undefined) {
      const parentItem = game.items[this.parentItemType]![location.parent]
      const parentLocator: ItemLocator<P, M, L> = locators[parentItem.location.type]
      return parentLocator.transformItemLocation(parentItem, { ...context, type: this.parentItemType, displayIndex: 0 })
    } else {
      const parentItemId = this.getParentItemId(location)
      const staticItem = parentMaterial.getItems(game, player).find(item => equal(item.id, parentItemId))
      if (!staticItem) return []
      const locator: ItemLocator<P, M, L> = locators[staticItem.location.type]
      return locator.transformItemLocation(staticItem, { ...context, type: this.parentItemType, displayIndex: 0 })
    }
  }

  getItemIndex(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): number {
    return item.location.x ?? item.location.y ?? item.location.z ?? context.displayIndex
  }

  isSameLocation(location1: Location<P, L>, location2: Location<P, L>) {
    return location1.type === location2.type && location1.player === location2.player && location1.parent === location2.parent
  }

  countItems(location: Location<P, L>, context: ItemContext<P, M, L>): number {
    const items = context.game.items[context.type]
    if (!items) return 0
    return items.reduce((sum, item) => this.isSameLocation(item.location, location) ? sum + (item.quantity ?? 1) : sum, 0)
  }

  getMaterial(game: MaterialGame<P, M, L>, type: M) {
    return new Material<P, M, L>(type, Array.from((game.items[type] ?? []).entries()).filter(entry => entry[1].quantity !== 0))
  }

  getRelativePlayerIndex({ game: { players }, player: me }: MaterialContext<P, M, L>, player: P): number {
    const absoluteIndex = players.indexOf(player)
    if (me === undefined || players[0] === me) return absoluteIndex
    return (absoluteIndex - players.indexOf(me) + players.length) % players.length
  }

  isItemToAnimate(
    { type, index, displayIndex }: DisplayedItem<M>,
    animation: Animation<ItemMove<P, M, L>>,
    { rules: { game } }: ItemAnimationContext<P, M, L>
  ): boolean {
    if (isMoveItem(animation.move) || isDeleteItem(animation.move)) {
      let quantity = game.items[type]![index].quantity ?? 1
      if (quantity === 1) return true
      if (this.limit) quantity = Math.min(quantity, this.limit)
      if (game.droppedItem?.type === type && game.droppedItem.index === index) {
        const droppedIndex = game.droppedItem.displayIndex
        if (displayIndex === droppedIndex) return true
        if (droppedIndex < quantity - (animation.move.quantity ?? 1)) {
          return displayIndex > quantity - (animation.move.quantity ?? 1)
        }
      }
      return displayIndex >= quantity - (animation.move.quantity ?? 1)
    } else if (isCreateItem(animation.move)) {
      const quantity = game.items[type]![index].quantity ?? 1
      return displayIndex >= quantity - (animation.move.item.quantity ?? 1)
    }
    return false
  }
}

export type MaterialContext<Player extends number = number, MaterialType extends number = number, LocationType extends number = number> = {
  game: MaterialGame<Player, MaterialType, LocationType>
  material: Record<MaterialType, MaterialDescription<Player, MaterialType, LocationType>>
  locators: Record<LocationType, ItemLocator<Player, MaterialType, LocationType>>
  player?: Player
}

export type ItemContext<P extends number = number, M extends number = number, L extends number = number> = MaterialContext<P, M, L> & DisplayedItem<M>

export type LocationRulesProps<P extends number = number, L extends number = number> = {
  location: Location<P, L>
  closeDialog: () => void
}
