/** @jsxImportSource @emotion/react */
import {
  Coordinates,
  isMoveToLocation,
  Location,
  Material,
  MaterialGame,
  MaterialItem,
  MaterialRules,
  MaterialRulesMove,
  XYCoordinates
} from '@gamepark/rules-api'
import { getPropForItem, MaterialDescription, SimpleDropArea } from '../components'
import { DragLayerMonitor } from 'react-dnd'
import { ReactNode } from 'react'
import { css, Interpolation, Theme } from '@emotion/react'
import equal from 'fast-deep-equal'
import { ComponentSize, getPositionTransforms } from '../css'

export abstract class ItemLocator<P extends number = number, M extends number = number, L extends number = number> {
  material: Record<M, MaterialDescription>
  locators: Record<L, ItemLocatorCreator<P, M, L>>
  player?: P
  parentItemType?: M
  rotationUnit = 'deg'
  limit?: number

  constructor(material: Record<M, MaterialDescription>, locators: Record<L, ItemLocatorCreator<P, M, L>>, player?: P) {
    this.material = material
    this.locators = locators
    this.player = player
  }

  hide(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): boolean {
    return this.limit ? this.getItemIndex(item, context) >= this.limit : false
  }

  place(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): string {
    return this.getTransforms(item, context).join(' ')
  }

  itemExtraCss(_item: MaterialItem<P, L>, _context: PlaceItemContext<P, M, L>): Interpolation<Theme> {
    return
  }

  getTransforms(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): string[] {
    return this.getParentTransforms(item.location, context.game).concat(...this.getChildTransforms(item, context))
  }

  getChildTransforms(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): string[] {
    return [this.getTranslate3d(item, context), ...this.getRotations(item, context)]
  }

  getTranslate3d(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): string {
    let { x, y, z } = this.getPosition(item, context)
    const parentMaterial = this.parentItemType ? this.material[this.parentItemType] : undefined
    if (parentMaterial) {
      const positionOnParent = this.getPositionOnParent?.(item.location)
      if (positionOnParent) {
        const { height, ratio } = getPropForItem(parentMaterial.props, this.getParentItemId(item.location)) as ComponentSize
        x += height * ratio * (positionOnParent.x - 50) / 100
        y += height * (positionOnParent.y - 50) / 100
      }
    }
    return `translate3d(${x}em, ${y}em, ${z}em)`
  }

  getParentItemId(_location: Location<P, L>): number | undefined {
    return undefined
  }

  /**
   * Place the center of the item on the screen
   *
   * @param item Item being placed
   * @param context Placement context (type of item, and index if item has a quantity to display)
   * @return The delta coordinates in em of the center of the item from the center of their parent (or the screen)
   */
  getPosition(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): Coordinates {
    return { x: 0, y: 0, z: this.getItemThickness(item, context) }
  }

  /**
   * Place the center of the item in the plan of their parent item. This is ignored if "parentItemType" is undefined.
   * Examples: {x: 0, y: 0} places the center of the item in the top-left corner of the parent item
   * {x: 50, y: 50} centers the item in the parent item.
   *
   * @param location Location of the item or area inside the parent item
   * @return {x, y} with "x" as a percentage from the parent's width, "y" a percentage of the height
   */
  getPositionOnParent?(location: Location<P, L>): XYCoordinates

  getRotations(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): string[] {
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

  getRotation?(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): number

  isHidden(_item: MaterialItem<P, L>, _context: PlaceItemContext<P, M, L>): boolean {
    return false
  }

  getParentTransforms(location: Location<P, L>, game: MaterialGame<P, M, L>): string[] {
    if (!this.parentItemType) return []
    const parentMaterial = this.material[this.parentItemType]
    const parentItem = game.items[this.parentItemType]?.find(item => equal(item.id, location.parent))
    if (parentItem) {
      const parentLocator: ItemLocator<P, M, L> = new this.locators[parentItem.location.type](this.material, this.locators, this.player)
      return parentLocator.getTransforms(parentItem, { game, type: this.parentItemType, index: 0, legalMoves: [] })
    } else {
      const parentItemId = this.getParentItemId(location)
      const staticItem = parentMaterial.items?.find(item => equal(item.id, parentItemId))
      if (!staticItem) return []
      return getPositionTransforms(staticItem.position, staticItem.rotation)
    }
  }

  getItemThickness(_item: MaterialItem<P, L>, _context: PlaceItemContext<P, M, L>): number {
    return 0.05
  }

  getItemIndex(item: MaterialItem<P, L>, context: PlaceItemContext<P, M, L>): number {
    return item.location.x ?? item.location.y ?? item.location.z ?? context.index
  }

  isSameLocation(location1: Location<P, L>, location2: Location<P, L>) {
    return location1.type === location2.type && location1.player === location2.player && location1.parent === location2.parent
  }

  countItems(location: Location<P, L>, context: PlaceItemContext<P, M, L>): number {
    return context.game.items[context.type]!.reduce((sum, item) => this.isSameLocation(item.location, location) ? sum + (item.quantity ?? 1) : sum, 0)
  }

  /**
   * Elevation in em to give to the item when it is being dragged. Defaults to 10em
   */
  getDragElevation(_monitor: DragLayerMonitor, _item: MaterialItem<P, L>, _context: PlaceItemContext<P, M, L>) {
    return 10
  }

  getMaterial(game: MaterialGame<P, M, L>, type: M) {
    return new Material<P, M, L>(type, Array.from((game.items[type] ?? []).entries()).filter(entry => entry[1].quantity !== 0))
  }

  createLocationsOnItem<ParentItemId extends number | undefined>(parent: ParentItemId, legalMoves: MaterialRulesMove<P, M, L>[], rules: MaterialRules<P, M, L>): ReactNode {
    const locations = this.getParentItemLocations?.(parent) ?? []
    return locations.map(location => this.createLocation(location, rules, legalMoves.filter(move => isMoveToLocation(move, location, rules))))
  }

  getParentItemLocations?<ParentItemId extends number | undefined>(_parent: ParentItemId): Location<P, L>[]

  createLocation(location: Location<P, L>, rules: MaterialRules<P, M, L>, legalMoves: MaterialRulesMove<P, M, L>[]): ReactNode {
    const position = this.getPositionOnParent?.(location) ?? { x: 0, y: 0 }
    return <SimpleDropArea key={JSON.stringify(location)} legalMoves={legalMoves} locator={this}
                           css={[childLocationCss(position), this.getLocationCss(location, rules, legalMoves)]}
                           rules={rules} location={location}/>
  }

  getLocationCss(_location: Location<P, L>, _rules: MaterialRules<P, M, L>, _legalMoves: MaterialRulesMove<P, M, L>[]): Interpolation<Theme> {
    return
  }

  getLocationRules?(props: LocationRulesProps<P, M, L>): ReactNode

  getRelativePlayerIndex({ game: { players }, player: me }: PlaceItemContext<P, M, L>, player: P): number {
    const absoluteIndex = players.indexOf(player)
    if (me === undefined || players[0] === me) return absoluteIndex
    return (absoluteIndex + players.indexOf(me) + 1) % players.length
  }
}

export interface ItemLocatorCreator<P extends number = number, M extends number = number, L extends number = number> {
  new(material: Record<M, MaterialDescription>, locators: Record<L, ItemLocatorCreator<P, M, L>>, player?: P): ItemLocator<P, M, L>
}

const childLocationCss = ({ x, y }: XYCoordinates) => css`
  position: absolute;
  left: ${x}%;
  top: ${y}%;
  transform: translate(-50%, -50%);
`

export type PlaceItemContext<Player extends number = number, MaterialType extends number = number, LocationType extends number = number> = {
  game: MaterialGame<Player, MaterialType, LocationType>
  type: MaterialType
  index: number
  legalMoves: MaterialRulesMove<Player, MaterialType, LocationType>[]
  player?: Player
}

export type LocationRulesProps<P extends number = number, M extends number = number, L extends number = number> = {
  location: Location<P, L>
  legalMoves: MaterialRulesMove<P, M, L>[]
  close: () => void
}
