/**
 * Keeps track of the `<MaterialGameSounds/>` a game mounts itself, so the one {@link GameProvider} mounts on
 * its behalf can stand down.
 *
 * Two mounted instances are not harmless: each one builds its own {@link AudioLoader}, hence its own
 * `AudioContext` and its own copy of every decoded buffer, and every sound is heard twice. Games have been
 * mounting the component by hand for a long time, and the framework now mounts it for the ones that never
 * did — so both have to coexist without ever playing together.
 *
 * The count is a module-level value rather than a context because the two instances are not on the same
 * branch: the game's is a descendant of the provider's, and a descendant cannot tell an ancestor it exists
 * through React state alone.
 */

let explicitInstances = 0

const listeners = new Set<() => void>()

/**
 * Declare that a game mounted `<MaterialGameSounds/>` itself. Call it from a layout effect: those run
 * bottom-up before any passive effect, so the count is already right when the provider's instance decides
 * whether to play.
 *
 * @returns the function to call on unmount
 */
export const registerExplicitSounds = (): (() => void) => {
  explicitInstances++
  listeners.forEach(listener => listener())
  return () => {
    explicitInstances--
    listeners.forEach(listener => listener())
  }
}

/** Subscribe to changes, for `useSyncExternalStore`. */
export const subscribeToExplicitSounds = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Whether a game mounted `<MaterialGameSounds/>` itself. */
export const hasExplicitSounds = (): boolean => explicitInstances > 0
