import { FlatMaterialDescription } from './FlatMaterial'

export class CardDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends FlatMaterialDescription<P, M, L, ItemId> {
  width = 6.35
  height = 8.8
  borderRadius = 0.4
}
