/** @jsxImportSource @emotion/react */
import { Coordinates, DisplayedItem, Location, Material, MaterialGame, MaterialItem, MaterialRules, XYCoordinates } from '@gamepark/rules-api'
import equal from 'fast-deep-equal'
import sumBy from 'lodash/sumBy'
import { LocationDescription, MaterialDescriptionRecord } from '../components'

export class ItemLocator<P extends number = number, M extends number = number, L extends number = number> {
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
      const { width, height } = parentMaterial.getSize(this.getParentItemId(item.location), context)
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
    return { ...this.position, z: context.material[context.type]?.getThickness(item, context) ?? 0 }
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
    const { rules, material, locators } = context
    const parentMaterial = material[this.parentItemType]
    if (location.parent !== undefined) {
      const parentItem = rules.material(this.parentItemType).getItem(location.parent)!
      const parentLocator = locators[parentItem.location.type]
      return parentLocator?.transformItemLocation(parentItem, { ...context, type: this.parentItemType, displayIndex: 0 }) ?? []
    } else {
      const parentItemId = this.getParentItemId(location)
      const staticItem = parentMaterial?.getStaticItems(context).find(item => equal(item.id, parentItemId))
      if (!staticItem) return []
      const locator = locators[staticItem.location.type]
      return locator?.transformItemLocation(staticItem, { ...context, type: this.parentItemType, displayIndex: 0 }) ?? []
    }
  }

  getItemIndex(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): number {
    return item.location.x ?? item.location.y ?? item.location.z ?? context.displayIndex
  }

  isSameLocation(location1: Location<P, L>, location2: Location<P, L>) {
    return location1.type === location2.type && location1.player === location2.player && location1.id === location2.id && location1.parent === location2.parent
  }

  countItems(location: Location<P, L>, { rules, type }: ItemContext<P, M, L>): number {
    return sumBy(rules.material(type).getItems(), item => this.isSameLocation(item.location, location) ? (item.quantity ?? 1) : 0)
  }

  getMaterial(game: MaterialGame<P, M, L>, type: M) {
    return new Material<P, M, L>(type, Array.from((game.items[type] ?? []).entries()).filter(entry => entry[1].quantity !== 0))
  }

  getRelativePlayerIndex({ rules: { players }, player: me }: MaterialContext<P, M, L>, player: P): number {
    const absoluteIndex = players.indexOf(player)
    if (me === undefined || players[0] === me) return absoluteIndex
    return (absoluteIndex - players.indexOf(me) + players.length) % players.length
  }
}

export type ItemLocatorRecord<P extends number = number, M extends number = number, L extends number = number> = Record<L, ItemLocator<P, M, L>>

export type MaterialContext<P extends number = number, M extends number = number, L extends number = number> = {
  rules: MaterialRules<P, M, L>
  material: Partial<MaterialDescriptionRecord<P, M, L>>
  locators: Partial<ItemLocatorRecord<P, M, L>>
  player?: P
}

export type ItemContext<P extends number = number, M extends number = number, L extends number = number> = MaterialContext<P, M, L> & DisplayedItem<M>

export type LocationContext<P extends number = number, M extends number = number, L extends number = number> = MaterialContext<P, M, L> & {
  canDrop?: boolean
}

export type LocationRulesProps<P extends number = number, L extends number = number> = {
  location: Location<P, L>
  closeDialog: () => void
}

export const centerLocator = new ItemLocator()
