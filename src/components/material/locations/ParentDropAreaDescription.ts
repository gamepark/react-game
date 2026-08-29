import { Location } from '@gamepark/rules-api'
import { LocationContext } from '../../../locators'
import { DropAreaDescription } from './DropAreaDescription'

/**
 * A drop area that *is* the parent item it stands on: it covers it, so it is centred on it and takes none of
 * the coordinates its locator hands out.
 *
 * What {@link Locator.getLocationDescription} draws by itself for a location that names a parent item and no
 * spot of it - the whole card one drops a pawn onto, whichever of its slots the pawn ends up in. The size was
 * always the parent's; the position used to come from the locator, and the locator is answering another
 * question: where the *items the location holds* stand on the parent. The two part company as soon as that is
 * a spot inside the parent - the slot printed near one edge of a card, the half-column a list is centred on,
 * the lift of a pawn drawn standing on its base. A box the size of the whole card that followed those hangs
 * off the card by exactly that much, while claiming to cover it.
 *
 * What is kept is what still concerns the box: the rotation of the location, and the lift that puts a drop
 * area above the item it covers while something can be dropped on it.
 *
 * An area that genuinely stands somewhere else than on its parent - a zone laid out below a card, a stack
 * printed in a corner of a board - is not this: it wants the locator's position, and says so by declaring a
 * plain {@link DropAreaDescription} as its locator's {@link Locator.locationDescription}.
 */
export class ParentDropAreaDescription<P extends number = number, M extends number = number, L extends number = number, Id = any, R extends number = number, V extends number = number>
  extends DropAreaDescription<P, M, L, Id, R, V> {

  positionOnParent = { x: 50, y: 50 }

  getLocationTransform(location: Location<P, L>, context: LocationContext<P, M, L, R, V>): string[] {
    const transform = ['translate(-50%, -50%)']
    const locator = context.locators[location.type]
    const rotateZ = locator?.getRotateZ(location, context) ?? 0
    if (rotateZ) transform.push(`rotateZ(${rotateZ}${locator!.rotationUnit})`)
    if (context.canDrop) transform.push('translateZ(5em)')
    return transform
  }
}
