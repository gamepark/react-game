import { FlatMaterialDescription } from './FlatMaterial'

export abstract class CardDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends FlatMaterialDescription<P, M, L, ItemId> {
  width = 6.35
  ratio = 5 / 7
  borderRadius = 0.4
}
