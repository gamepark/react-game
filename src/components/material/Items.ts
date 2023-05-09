import { Coordinates } from '@gamepark/rules-api'

export type StaticMaterialItem<Id extends number = number> = {
  id?: Id
  position: Coordinates
  rotation?: Partial<Coordinates>
}

export type ItemCustomization<Props, ItemId extends number = number> = {
  [Property in keyof Props]: Props[Property] extends object | undefined ? ItemCustomization<Props[Property], ItemId> : ItemProp<Props[Property], ItemId>
}

export type ItemProp<T, ItemId extends number = number> = T | Record<ItemId, T> | ((id?: ItemId) => T)
