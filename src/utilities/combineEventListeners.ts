export function combineEventListeners<T extends Object>(listeners: T, props: Record<string, any>): T {
  return Object.entries(listeners).reduce((result, [key, value]) => {
    result[key] = typeof props[key] === 'function' ? (...args: any) => {
      value(...args)
      return props[key](...args)
    } : value
    return result
  }, {}) as T
}
