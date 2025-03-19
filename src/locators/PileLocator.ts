import { Coordinates, Location, MaterialItem, XYCoordinates } from '@gamepark/rules-api'
import { CardDescription, DropAreaDescription, LocationDescription } from '../components'
import { getItemFromContext, ItemContext, Locator, MaterialContext } from './Locator'

/**
 * This Locator places items in a disorganised pile.
 */
export class PileLocator<P extends number = number, M extends number = number, L extends number = number> extends Locator<P, M, L> {

  constructor(clone?: Partial<PileLocator>) {
    super()
    Object.assign(this, clone)
  }

  private positions = new Map<string, Map<number, XYCoordinates>>()
  private rotations = new Map<string, Map<number, number>>()

  /**
   * By default, a maximum of 20 items are displayed
   */
  limit? = 20

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
   * @param item Item to position
   * @param _context Context of the item
   * @returns a unique identifier for the pile of items this location goes to
   */
  getPileId(item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): string {
    return [item.location.player, item.location.id, item.location.parent].filter(part => part !== undefined).join('_')
  }

  getItemCoordinates(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): Partial<Coordinates> {
    const location = item.location
    const index = this.getItemIndex(item, context)
    const itemUniqueId = context.index + context.displayIndex
    const pileId = this.getPileId(item, context)
    if (!this.positions.has(pileId)) this.positions.set(pileId, new Map())
    const pilePositions = this.positions.get(pileId)!
    const radius = this.getRadius(location, context)
    const { x = 0, y = 0, z = 0 } = this.getCoordinates(location, context)
    if (!pilePositions.has(itemUniqueId)) {
      const distance = Math.random()
      const direction = Math.random() * 2 * Math.PI
      pilePositions.set(itemUniqueId, {
        x: x + Math.cos(direction) * Math.sqrt(distance) * (typeof radius === 'number' ? radius : radius.x),
        y: y + Math.sin(direction) * Math.sqrt(distance) * (typeof radius === 'number' ? radius : radius.y),
      })
    }
    return {...pilePositions.get(itemUniqueId)!, z: z + index * 0.05}
  }

  getItemRotateZ(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): number {
    const itemUniqueId = context.index + context.displayIndex
    const pileId = this.getPileId(item, context)
    if (!this.rotations.has(pileId)) this.rotations.set(pileId, new Map())
    const pileRotations = this.rotations.get(pileId)!
    if (!pileRotations.has(itemUniqueId)) {
      const maxAngle = this.getMaxAngle(item.location, context)
      pileRotations.set(itemUniqueId, (Math.random() - 0.5) * maxAngle)
    }
    return this.getRotateZ(item.location, context) + pileRotations.get(itemUniqueId)!
  }

  protected generateLocationDescriptionFromDraggedItem(location: Location<P, L>, context: ItemContext<P, M, L>): LocationDescription<P, M, L> {
    const itemDescription = context.material[context.type] ?? new CardDescription()
    const item = getItemFromContext(context)
    const { width, height } = itemDescription.getSize(item.id)
    if (this.getMaxAngle(location, context) < 180) {
      return new DropAreaDescription(itemDescription)
    } else {
      const max = Math.max(width, height)
      const radius = this.getRadius(location, context)
      return new DropAreaDescription({
        width: max + (typeof radius === 'number' ? radius * 2 : radius.x * 2),
        height: max + (typeof radius === 'number' ? radius * 2 : radius.y * 2),
        borderRadius: max / 2 + (typeof radius === 'number' ? radius : Math.max(radius.x, radius.y))
      })
    }
  }
}
