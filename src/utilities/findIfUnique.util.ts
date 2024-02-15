export function findIfUnique<T>(collection: ArrayLike<T>, predicate: (value: T, index: number, collection: ArrayLike<T>) => boolean): T | undefined {
  let result = undefined
  for (let i = 0; i < collection.length; i++) {
    const t = collection[i]
    if (predicate(t, i, collection)) {
      if (result !== undefined) return undefined
      result = t
    }
  }
  return result
}