import { ClientRect, getClientRect } from '@dnd-kit/core'

/**
 * The rect of a draggable item where it lies: with the transform that places it, without the translation of the drag.
 *
 * Items are placed by their transform, so dnd-kit has to measure them with it (getClientRect). But while an item is
 * dragged, dnd-kit measures it again whenever its node changes (any render of the item, e.g. when the game moves on
 * meanwhile) and takes off its translation what the item moved since the drag began, so that an item moved by the
 * layout stays under the pointer. Measured with the translation of the drag, the item seems to have moved by that
 * translation, which is then taken off the translation itself: the item swings further away at every measure, out of
 * the table. The dragged item carries its transform at rest (see ItemDisplay), which it wears while it is measured.
 */
export const measureAtRest = (element: HTMLElement): ClientRect => {
  const restTransform = element.dataset.restTransform
  if (restTransform === undefined) return getClientRect(element)
  const dragTransform = element.style.transform
  element.style.transform = restTransform
  const rect = getClientRect(element)
  element.style.transform = dragTransform
  return rect
}
