export type ItemCustomization<Props, ItemId = number> = {
  [Property in keyof Props]: Props[Property] extends object | undefined ? ItemCustomization<Props[Property], ItemId> : ItemProp<Props[Property], ItemId>
}

export type ItemProp<T, ItemId = number> = ItemId extends number ? T | Record<ItemId, T> | ((id?: ItemId) => T) : T | ((id?: ItemId) => T);
