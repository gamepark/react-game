import { FlatMaterialDescription } from './FlatMaterial'
import { ComponentSize } from '../MaterialDescription'

export abstract class TokenDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends FlatMaterialDescription<P, M, L, ItemId> {
  ratio = 1
}

export abstract class RoundTokenDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends TokenDescription<P, M, L, ItemId> {

  abstract diameter: number

  override getSize(_itemId: ItemId): ComponentSize {
    return { width: this.diameter, height: this.diameter }
  }

  override getBorderRadius(): number {
    return this.diameter / 2
  }
}
