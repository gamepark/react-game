import { Coordinates, Location, MaterialItem } from '@gamepark/rules-api'
import { CardDescription, DropAreaDescription, LocationDescription } from '../components'
import { getItemFromContext, ItemContext, Locator, MaterialContext } from './Locator'

/**
 * This Locator places items fan-shaped to mimic the ways we hold cards in our hands.
 */
export class HandLocator<P extends number = number, M extends number = number, L extends number = number> extends Locator<P, M, L> {

  constructor(clone?: Partial<HandLocator>) {
    super()
    Object.assign(this, clone)
  }

  /**
   * Items are place around the circle of an arc. This is the radius of the arc. Override {@link getRadius} to provide a dynamic radius.
   */
  radius: number = 100

  /**
   * Provide the radius of the circle. Defaults to {@link radius} property.
   * @param _location Location to position
   * @param _context Context of the game
   * @returns the radius of the circle in cm
   */
  getRadius(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number {
    return this.radius
  }

  /**
   * The default angle of the hand items. For instance, 180 will display the hand oriented towards the bottom of the screen.
   */
  baseAngle: number = 0

  /**
   * Function to override to provide a {@link baseAngle} that depends on the context
   * @param _location Location to position
   * @param _context Context of the game
   * @returns the default angle of the items
   */
  getBaseAngle(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number {
    return this.baseAngle
  }

  /**
   * The maximum angle that is allowed between the first and the last items displayed.
   */
  maxAngle: number = 15

  /**
   * Function to override to provide a {@link maxAngle} that depends on the context
   * @param _location Location to position
   * @param _context Context of the game
   * @returns the maximum angle between the first and the last items
   */
  getMaxAngle(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number {
    return this.maxAngle
  }

  /**
   * The maximum angle between two consecutive items in the hand
   */
  gapMaxAngle: number = 3

  /**
   * Function to override to provide a {@link gapMaxAngle} that depends on the context
   * @param _location Location to position
   * @param _context Context of the game
   * @returns The maximum angle between two consecutive items in the hand
   */
  getGapMaxAngle(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number {
    return this.gapMaxAngle
  }

  /**
   * The direction of the items displayed, for the first to the last index. Default is true.
   */
  clockwise: boolean = true

  /**
   * Function to override to provide a {@link clockwise} info that depends on the context
   * @param _location Location to position
   * @param _context Context of the game
   * @returns true if items should be displayed clockwise around the arc of circle. Default is true.
   */
  isClockwise(_location: Location<P, L>, _context: MaterialContext<P, M, L>): boolean {
    return this.clockwise
  }

  /**
   * The Z-axis position difference between 2 consecutive items in the hand. Default is 0.05cm.
   */
  deltaZ: number = 0.05

  /**
   * Function to override to provide a {@link deltaZ} that depends on the context
   * @param _location Location to position
   * @param _context Context of the game
   * @returns The Z-axis position difference between 2 consecutive items in the hand. Default is 0.05cm.
   */
  getDeltaZ(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number {
    return this.deltaZ
  }

  /**
   * See {@link Locator.getLocationCoordinates}.
   * @param location Location to position
   * @param context Context of the game
   * @param index Index of the item (or location) to place
   */
  getLocationCoordinates(location: Location<P, L>, context: MaterialContext<P, M, L>,
                         index = this.getLocationIndex(location, context)): Coordinates {
    const { x = 0, y = 0, z = 0 } = this.getCoordinates(location, context)
    if (index === undefined) return { x, y, z }
    const deltaZ = this.getDeltaZ(location, context)
    const radius = this.getRadius(location, context)
    const baseAngle = this.getBaseAngle(location, context)
    const angle = this.getRotateZ(location, context, index)
    return {
      x: x + radius * Math.sin(angle * Math.PI / 180) - radius * Math.sin(baseAngle * Math.PI / 180),
      y: y - radius * Math.cos(angle * Math.PI / 180) + radius * Math.cos(baseAngle * Math.PI / 180),
      z: z + index * deltaZ
    }
  }

  getItemCoordinates(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): Coordinates {
    return this.getLocationCoordinates(item.location, context, this.getItemIndex(item, context))
  }

  /**
   * See {@link Locator.getRotateZ}.
   * @param location Location to position
   * @param context Context of the game
   * @param index Index of the item (or location) to place
   */
  getRotateZ(location: Location<P, L>, context: MaterialContext<P, M, L>,
             index = this.getLocationIndex(location, context)): number {
    const baseAngle = this.getBaseAngle(location, context)
    if (index === undefined) return baseAngle
    const size = this.countItems(location, context)
    const maxAngle = this.getMaxAngle(location, context)
    const gapMaxAngle = this.getGapMaxAngle(location, context)
    const gapAngle = size > 1 ? Math.min(maxAngle / (size - 1), gapMaxAngle) : 0
    return baseAngle + (index - (size - 1) / 2) * gapAngle * (this.isClockwise(location, context) ? 1 : -1)
  }

  getItemRotateZ(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): number {
    if (context.dragTransform) return 0
    return this.getRotateZ(item.location, context, this.getItemIndex(item, context))
  }

  protected generateLocationDescriptionFromDraggedItem(_location: Location<P, L>, context: ItemContext<P, M, L>): LocationDescription<P, M, L> {
    const itemDescription = context.material[context.type] ?? new CardDescription()
    const item = getItemFromContext(context)
    const { width, height } = itemDescription.getSize(item.id)
    const borderRadius = itemDescription.getBorderRadius(item.id)
    const max = Math.max(width, height)
    return new DropAreaDescription({
      width: max * 3,
      height: max + 1,
      borderRadius
    })
  }

  /**
   * See {@link Locator.getHoverTransform}. By default, display the item on top of others, straight, and twice as big.
   */
  getHoverTransform(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string[] {
    return ['translateZ(10em)', `rotateZ(${-this.getItemRotateZ(item, context)}${this.rotationUnit})`, 'scale(2)']
  }
}
