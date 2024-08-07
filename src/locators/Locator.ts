/** @jsxImportSource @emotion/react */
import { Coordinates, DisplayedItem, isSameLocationArea, Location, MaterialItem, MaterialRules, XYCoordinates } from '@gamepark/rules-api'
import isEqual from 'lodash/isEqual'
import sumBy from 'lodash/sumBy'
import { LocationDescription, MaterialDescriptionRecord } from '../components'

export type SortFunction = ((item: MaterialItem) => number)

export class Locator<P extends number = number, M extends number = number, L extends number = number> {
  parentItemType?: M
  limit?: number
  locationDescription?: LocationDescription<P, M, L>
  rotationUnit: string = 'deg'

  location?: Location<P, L>
  locations: Location<P, L>[] = []

  getLocations(_context: MaterialContext<P, M, L>): Location<P, L>[] {
    return this.location ? [this.location] : this.locations
  }

  getLocationDescription(context: MaterialContext<P, M, L>): LocationDescription<P, M, L> | undefined {
    if (!this.locationDescription && this.parentItemType !== undefined) {
      const material = context.material[this.parentItemType]
      if (material) {
        this.locationDescription = new LocationDescription<P, M, L>()
        this.locationDescription.width = material.width
        this.locationDescription.height = material.height
        this.locationDescription.ratio = material.ratio
        this.locationDescription.borderRadius = material.borderRadius
        this.locationDescription.alwaysVisible = false
      }
    }
    return this.locationDescription
  }

  hide(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): boolean {
    return this.limit ? this.getItemIndex(item, context) >= this.limit : false
  }

  transformItem(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string[] {
    return ['translate(-50%, -50%)', ...this.transformItemLocation(item, context)]
  }

  transformItemLocation(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string[] {
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
      const { width, height } = parentMaterial.getSize(this.getParentItemId(item.location, context))
      x += width * (positionOnParent.x - 50) / 100
      y += height * (positionOnParent.y - 50) / 100
    }
    return `translate3d(${x}em, ${y}em, ${z}em)`
  }

  getParentItem(location: Location<P, L>, context: ItemContext<P, M, L>): MaterialItem<P, L> | undefined {
    if (this.parentItemType === undefined) return undefined
    const parentItemId = this.getParentItemId(location, context)
    const parentMaterial = context.material[this.parentItemType]
    return parentMaterial?.getStaticItems(context).find(item => isEqual(item.id, parentItemId))
  }

  getParentItemId(_location: Location<P, L>, _context: ItemContext<P, M, L>): number | undefined {
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

  rotateZ: number = 0

  getRotateZ(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): number {
    return this.rotateZ
  }

  getRotations(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string[] {
    const rotateZ = this.getRotateZ(item, context)
    const rotations = context.material[context.type]?.getRotations(item, context) ?? []
    return [`rotateZ(${rotateZ ?? 0}${this.rotationUnit})`, ...rotations]
  }

  protected transformParentItemLocation(location: Location<P, L>, context: ItemContext<P, M, L>): string[] {
    if (!this.parentItemType) return []
    const { rules, locators } = context
    if (location.parent !== undefined) {
      const parentItem = rules.material(this.parentItemType).getItem(location.parent)!
      const parentLocator = locators[parentItem.location.type]
      return parentLocator?.transformItemLocation(parentItem, { ...context, type: this.parentItemType, displayIndex: 0 }) ?? []
    } else {
      const staticItem = this.getParentItem(location, context)
      if (!staticItem) return []
      const locator = locators[staticItem.location.type]
      return locator?.transformItemLocation(staticItem, { ...context, type: this.parentItemType, displayIndex: 0 }) ?? []
    }
  }

  getItemIndex(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): number {
    return item.location.x ?? item.location.y ?? item.location.z ?? context.displayIndex
  }

  countItems(location: Location<P, L>, { rules, type }: ItemContext<P, M, L>): number {
    return sumBy(rules.material(type).getItems(), item => isSameLocationArea(item.location, location) ? (item.quantity ?? 1) : 0)
  }

  navigationSorts: SortFunction[] = [(item) => item.location.x ?? 0, (item) => item.location.y ?? 0, (item) => item.location.z ?? 0]

  getNavigationSorts(_context: ItemContext<P, M, L>): SortFunction[] {
    return this.navigationSorts
  }
}

export type ItemLocatorRecord<P extends number = number, M extends number = number, L extends number = number> = Record<L, Locator<P, M, L>>

export type MaterialContext<P extends number = number, M extends number = number, L extends number = number> = {
  rules: MaterialRules<P, M, L>
  material: Partial<MaterialDescriptionRecord<P, M, L>>
  locators: Partial<ItemLocatorRecord<P, M, L>>
  player?: P
}

export type ItemContext<P extends number = number, M extends number = number, L extends number = number> = MaterialContext<P, M, L> & DisplayedItem<M> & {
  dragTransform?: string
}

export type LocationContext<P extends number = number, M extends number = number, L extends number = number> = MaterialContext<P, M, L> & {
  canDrop?: boolean
}

export type LocationHelpProps<P extends number = number, L extends number = number> = {
  location: Location<P, L>
  closeDialog: () => void
}

export const centerLocator = new Locator()
