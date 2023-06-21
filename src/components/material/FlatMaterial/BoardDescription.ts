import { FlatMaterialDescription } from './FlatMaterial'

export abstract class BoardDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends FlatMaterialDescription<P, M, L, ItemId> {
}
