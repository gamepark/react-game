import { Coordinates, MaterialItem } from '@gamepark/rules-api'
import { ItemContext, ItemLocator } from './ItemLocator'

export abstract class PileLocator<P extends number = number, M extends number = number, L extends number = number> extends ItemLocator<P, M, L> {
  limit = 20
  private positions = new Map<string, Map<number, Coordinates>>()
  private rotations = new Map<string, Map<number, number>>()

  getPosition(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): Coordinates {
    const pileId = this.getPileId(item, context)
    if (!this.positions.has(pileId)) this.positions.set(pileId, new Map())
    const pilePositions = this.positions.get(pileId)!
    const index = this.getItemIndex(item, context)
    const radius = this.getRadius(item, context)
    if (!pilePositions.has(index)) {
      const coordinates = this.getCoordinates(item, context)
      const distance = Math.random()
      const direction = Math.random() * 2 * Math.PI
      pilePositions.set(index, {
        x: coordinates.x + Math.cos(direction) * Math.sqrt(distance) * radius,
        y: coordinates.y + Math.sin(direction) * Math.sqrt(distance) * radius,
        z: coordinates.z
      })
    }
    return pilePositions.get(index)!
  }

  getRotations(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string[] {
    const rotateZ = this.getRotateZ(item, context)
    const rotations = super.getRotations(item, context)
    return rotateZ ? [`rotateZ(${rotateZ}deg)`, ...rotations] : rotations
  }

  getRotateZ(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): number {
    if (!this.maxAngle) return 0
    const pileId = this.getPileId(item, context)
    if (!this.rotations.has(pileId)) this.rotations.set(pileId, new Map())
    const pileRotations = this.rotations.get(pileId)!
    const index = this.getItemIndex(item, context)
    if (!pileRotations.has(index)) {
      const maxAngle = this.getMaxAngle(item, context)
      pileRotations.set(index, (Math.random() - 0.5) * maxAngle)
    }
    return pileRotations.get(index) ?? 0
  }

  coordinates: Coordinates = { x: 0, y: 0, z: 0 }

  getCoordinates(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): Coordinates {
    return this.coordinates
  }

  radius = 0

  getRadius(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): number {
    return this.radius
  }

  maxAngle = 180

  getMaxAngle(_item: MaterialItem<P, L>, _context: ItemContext<P, M, L>): number {
    return this.maxAngle
  }

  getPileId(item: MaterialItem<P, L>, context: ItemContext<P, M, L>): string {
    return [item.location.player, item.location.id, item.location.parent, context.type].filter(part => part !== undefined).join('_')
  }
}
