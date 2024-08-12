/** @jsxImportSource @emotion/react */
import { Coordinates, DisplayedItem, isSameLocationArea, Location, MaterialItem, MaterialRules, XYCoordinates } from '@gamepark/rules-api'
import sumBy from 'lodash/sumBy'
import { LocationDescription, MaterialDescriptionRecord } from '../components'

export type SortFunction = ((item: MaterialItem) => number)

export class Locator<P extends number = number, M extends number = number, L extends number = number> {
  itemTypes: M[] = []
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

  placeLocation(location: Location<P, L>, context: LocationContext<P, M, L>): string[] {
    const transform: string[] = []
    const coordinates = this.getLocationCoordinates(location, context)
    if (coordinates) {
      transform.push(`translate3d(${coordinates.x}em, ${coordinates.y}em, ${coordinates.z}em)`)
    }
    const rotateZ = this.getRotateZ(location, context)
    if (rotateZ) {
      transform.push(`rotateZ(${rotateZ}${this.rotationUnit})`)
    }
    return transform
  }

  placeItem(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string[] {
    if (!this.itemTypes.includes(context.type)) {
      this.itemTypes.push(context.type)
    }
    const transform = this.placeItemOnParent(item.location, context)
    const { x, y, z } = this.getItemCoordinates(item, context)
    if (x || y || z) {
      transform.push(`translate3d(${x}em, ${y}em, ${z}em)`)
    }
    const rotateZ = this.getItemRotateZ(item, context)
    if (rotateZ) {
      transform.push(`rotateZ(${rotateZ}${this.rotationUnit})`)
    }
    return transform
  }

  protected placeItemOnParent(location: Location<P, L>, context: ItemContext<P, M, L>): string[] {
    const parentItem = this.getParentItem(location, context)
    if (this.parentItemType === undefined || !parentItem) return []
    const locator = context.locators[parentItem.location.type]
    if (!locator) return []
    const transform = locator.placeItem(parentItem, { ...context, type: this.parentItemType, displayIndex: 0 })
    const parentMaterial = context.material[this.parentItemType]
    const { x, y } = this.getPositionOnParent(location, context)
    if (parentMaterial && (x !== 0 || y !== 0)) {
      const { width, height } = parentMaterial.getSize(parentItem.id)
      transform.push(`translate(${width * (x - 50) / 100}em, ${height * (y - 50) / 100}em)`)
    }
    return transform
  }

  getParentItem(location: Location<P, L>, { rules, material }: ItemContext<P, M, L>): MaterialItem<P, L> | undefined {
    if (this.parentItemType === undefined) return undefined
    if (location.parent === undefined) return material[this.parentItemType]?.staticItem
    return rules.material(this.parentItemType).getItem(location.parent)
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

  coordinates: Partial<Coordinates> = { x: 0, y: 0, z: 0 }

  getLocationCoordinates(_location: Location<P, L>, _context: MaterialContext<P, M, L>): Partial<Coordinates> {
    return this.coordinates
  }

  /**
   * Place the center of the item on the screen
   *
   * @param item Item being placed
   * @param context Placement context (type of item, and index if item has a quantity to display)
   * @return The delta coordinates in em of the center of the item from the center of their parent (or the screen)
   */
  getItemCoordinates(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): Coordinates {
    const { x = 0, y = 0, z = context.material[context.type]?.getThickness(item, context) ?? 0 } = this.getLocationCoordinates(item.location, context)
    return { x, y, z }
  }

  rotateZ: number = 0

  getRotateZ(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number {
    return this.rotateZ
  }

  getItemRotateZ(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): number {
    return this.getRotateZ(item.location, context)
  }

  getLocationIndex(location: Location<P, L>, _context: MaterialContext<P, M, L>): number | undefined {
    return location.x ?? location.y ?? location.z
  }

  getItemIndex(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): number {
    return this.getLocationIndex(item.location, context) ?? context.displayIndex
  }

  countItems(location: Location<P, L>, { rules }: MaterialContext<P, M, L>): number {
    return sumBy(this.itemTypes, type => rules.material(type).location(itemLocation => isSameLocationArea(itemLocation, location)).getQuantity())
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
