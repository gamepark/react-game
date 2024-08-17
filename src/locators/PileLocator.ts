import { Coordinates, Location, MaterialItem, XYCoordinates } from '@gamepark/rules-api'
import { ItemContext, Locator, MaterialContext } from './Locator'

export class PileLocator<P extends number = number, M extends number = number, L extends number = number> extends Locator<P, M, L> {

  constructor(clone?: Partial<PileLocator>) {
    super()
    Object.assign(this, clone)
  }

  limit = 20
  private positions = new Map<string, Map<number, Coordinates>>()
  private rotations = new Map<string, Map<number, number>>()

  radius: number | XYCoordinates = 0

  getRadius(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number | XYCoordinates {
    return this.radius
  }

  maxAngle = 180

  getMaxAngle(_location: Location<P, L>, _context: MaterialContext<P, M, L>): number {
    return this.maxAngle
  }

  getPileId(location: Location<P, L>, _context: MaterialContext<P, M, L>): string {
    return [location.player, location.id, location.parent].filter(part => part !== undefined).join('_')
  }

  getLocationCoordinates(location: Location<P, L>, context: MaterialContext<P, M, L>,
                         index = this.getLocationIndex(location, context)): Partial<Coordinates> {
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

  getRotateZ(location: Location<P, L>, context: MaterialContext<P, M, L>,
             index = this.getLocationIndex(location, context) ?? 0): number {
    if (!this.maxAngle) return 0
    const pileId = this.getPileId(location, context)
    if (!this.rotations.has(pileId)) this.rotations.set(pileId, new Map())
    const pileRotations = this.rotations.get(pileId)!
    if (!pileRotations.has(index)) {
      const maxAngle = this.getMaxAngle(location, context)
      pileRotations.set(index, (Math.random() - 0.5) * maxAngle)
    }
    return pileRotations.get(index) ?? 0
  }

  getItemRotateZ(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): number {
    return this.getRotateZ(item.location, context, this.getItemIndex(item, context))
  }
}
