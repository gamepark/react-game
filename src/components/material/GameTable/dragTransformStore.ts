import { XYCoordinates } from '@gamepark/rules-api'

/**
 * The translation of the item being dragged, for the items laid on it (or moved at once with it), which must move with it.
 *
 * dnd-kit gives that translation to the dragged item only, in its own render. Given to the other items through its drag
 * events, it reached them one render later: they trailed one frame behind the dragged item at every move of the pointer.
 * The dragged item publishes it here in a layout effect, and the items that follow it read it with useSyncExternalStore:
 * React renders them before the frame is painted, so that they move in the same frame.
 */
let translation: XYCoordinates | undefined
const listeners = new Set<() => void>()

export const dragTransformStore = {
  get: (): XYCoordinates | undefined => translation,
  set(next: XYCoordinates | undefined) {
    if (next?.x === translation?.x && next?.y === translation?.y) return
    translation = next
    for (const listener of listeners) listener()
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }
}
