import { FlatMaterialDescription } from './FlatMaterial'

export abstract class BoardDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any, R extends number = number, V extends number = number>
  extends FlatMaterialDescription<P, M, L, ItemId, R, V> {
}
