import { Coordinates, Location, MaterialItem, XYCoordinates } from '@gamepark/rules-api'
import { CardDescription, DropAreaDescription, LocationDescription } from '../components'
import { ItemContext, Locator, MaterialContext } from './Locator'

/**
 * This Locator places items in a disorganised pile.
 */
export class PileLocator<P extends number = number, M extends number = number, L extends number = number> extends Locator<P, M, L> {

  constructor(clone?: Partial<PileLocator>) {
    super()
    Object.assign(this, clone)
  }

  private positions = new Map<string, Map<number, Coordinates>>()
  private rotations = new Map<string, Map<number, number>>()

  /**
   * By default, a maximum of 20 items are displayed
   */
  limit = 20

  /**
   * Maximum dispersion radius of the items.
   */
  radius: number | XYCoordinates = 0

  /**
   * Function to override to provide a {@link radius} that depends on the context
   * @param _location Location to position
   * @param _context Context of the game
   * @returns the maximum dispersion radius of the items.
   */
  getRadius(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number | XYCoordinates {
    return this.radius
  }

  /**
   * Maximum angle of rotation of the items. Defaults to 180, bidirectional so items can have any rotation.
   */
  maxAngle = 180

  /**
   * Function to override to provide a {@link maxAngle} that depends on the context
   * @param _location Location to position
   * @param _context Context of the game
   * @returns the maximum angle of rotation of the items
   */
  getMaxAngle(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number {
    return this.maxAngle
  }

  /**
   * Identifier of the pile. By default, distinct location areas (different player, id or parent) forms distinct piles.
   * @param location Location to position
   * @param _context Context of the game
   * @returns a unique identifier for the pile of items this location goes to
   */
  getPileId(location: Location<P, L>, _context: MaterialContext<P, M, L>): string {
    return [location.player, location.id, location.parent].filter(part => part !== undefined).join('_')
  }

  getLocationCoordinates(location: Location<P, L>, context: MaterialContext<P, M, L>,
                         index?: number): Partial<Coordinates> {
    if (index === undefined) return this.getCoordinates(location, context)
    const pileId = this.getPileId(location, context)
    if (!this.positions.has(pileId)) this.positions.set(pileId, new Map())
    const pilePositions = this.positions.get(pileId)!
    const radius = this.getRadius(location, context)
    if (!pilePositions.has(index)) {
      const { x = 0, y = 0, z = 0 } = this.getCoordinates(location, context)
      const distance = Math.random()
      const direction = Math.random() * 2 * Math.PI
      pilePositions.set(index, {
        x: x + Math.cos(direction) * Math.sqrt(distance) * (typeof radius === 'number' ? radius : radius.x),
        y: y + Math.sin(direction) * Math.sqrt(distance) * (typeof radius === 'number' ? radius : radius.y),
        z: z + index * 0.05
      })
    }
    return pilePositions.get(index)!
  }

  getItemCoordinates(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): Partial<Coordinates> {
    return this.getLocationCoordinates(item.location, context, this.getItemIndex(item, context))
  }

  getItemRotateZ(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): number {
    const index = this.getItemIndex(item, context)
    const pileId = this.getPileId(item.location, context)
    if (!this.rotations.has(pileId)) this.rotations.set(pileId, new Map())
    const pileRotations = this.rotations.get(pileId)!
    if (!pileRotations.has(index)) {
      const maxAngle = this.getMaxAngle(item.location, context)
      pileRotations.set(index, (Math.random() - 0.5) * maxAngle)
    }
    return pileRotations.get(index) ?? 0
  }

  protected generateLocationDescriptionFromDraggedItem(location: Location<P, L>, context: ItemContext<P, M, L>): LocationDescription<P, M, L> {
    const itemDescription = context.material[context.type] ?? new CardDescription()
    const item = context.rules.material(context.type).getItem(context.index)
    const { width, height } = itemDescription.getSize(item.id)
    const max = Math.max(width, height)
    const radius = this.getRadius(location, context)
    return new DropAreaDescription({
      width: max + (typeof radius === 'number' ? radius * 2 : radius.x * 2),
      height: max + (typeof radius === 'number' ? radius * 2 : radius.y * 2),
      borderRadius: max / 2 + (typeof radius === 'number' ? radius : Math.max(radius.x, radius.y))
    })
  }
}
