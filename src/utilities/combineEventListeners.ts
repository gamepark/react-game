/**
 * Combines listeners returned by useLongPress hook (onClick, onMouseDown...) with existing properties in order for both functions to be called.
 * @param listeners Listener functions
 * @param props React component properties
 * @returns the properties but if listeners and props contains the same function, both will be called (listener first, then props once which returns the value)
 */
export function combineEventListeners<T extends Object>(listeners: T, props: Record<string, any>): T {
  return Object.entries(listeners).reduce((result, [key, value]) => {
    result[key] = typeof props[key] === 'function' ? (...args: any) => {
      value(...args)
      return props[key](...args)
    } : value
    return result
  }, {}) as T
}
