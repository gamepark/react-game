import { FlatMaterialDescription } from './FlatMaterial'

export class CardDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any, R extends number = number, V extends number = number>
  extends FlatMaterialDescription<P, M, L, ItemId, R, V> {
  width = 6.3
  height = 8.8
  borderRadius = 0.4
}
