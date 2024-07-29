/**
 * Search for a value that match a predicate in a collection, but only return the match if it is the only match in the collection
 * @param collection Array of values
 * @param predicate Predicate function to test the value
 * @returns Matching item if and only if it is the only matching item
 */
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