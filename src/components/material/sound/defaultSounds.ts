import { ItemMoveType } from '@gamepark/rules-api'
import { MaterialSoundConfig } from './MaterialSoundConfig'

/**
 * Where the framework's own sounds are published.
 *
 * The files live in `sounds/` at the root of this repository and are pushed to that bucket by
 * `yarn sync-sounds`, which `yarn publish` runs. Adding a default sound is therefore: drop the `.mp3` in
 * `sounds/`, name it in the table below, publish.
 *
 * `rclone sync` mirrors, so it *deletes* on the bucket whatever is not in `sounds/`. That folder is the whole
 * content of the bucket, not an addition to it — never publish with a file removed from it by accident.
 */
const soundsUrl = 'https://sounds.game-park.com'

/**
 * How a material sounds when it is handled — not what it is made of.
 *
 * The distinction is the whole point of this enum being a choice rather than a physical property. Coins
 * punched out of cardboard want the metallic sound of coins, because that is the sound the game is asking the
 * player to imagine; a wooden meeple and a plastic one are told apart by ear far less than a meeple and a
 * card. So a game picks the sound it wants to hear, and it picks it in one line:
 *
 * ```ts
 * export class MyTokenDescription extends TokenDescription {
 *   soundKit = SoundKit.Wood
 * }
 * ```
 *
 * Cards and dice do not expose the choice on purpose: a card sounds like a card in every game, and there is
 * nothing to gain from letting each one re-answer a question with one sensible answer.
 */
export enum SoundKit {
  Card,
  Cardboard,
  Wood,
  Metal,
  Plastic,
  Dice
}

/**
 * Build a default sound from a file published in `sounds/`.
 *
 * The volume is always low, and deliberately so. These sounds play in every game, on moves no one asked to
 * hear, and a default that is a touch too loud is not a small annoyance to be tuned later — it is the reason
 * a player reaches for the mute button once and never turns the sound back on. A game that wants its own
 * sound to be prominent raises it itself.
 */
export const defaultSound = (file: string, volume: number): MaterialSoundConfig => ({ sound: `${soundsUrl}/${file}`, volume })

/**
 * The sound each kit plays for each kind of move, or nothing when that move is better left silent.
 *
 * Silence is a real answer here, and it is the one given to `ItemMoveType.Select`: selecting fires when a
 * player merely designates an item, several times a turn and often just to look at it, so a click on every one
 * of them turns into a stutter. What is left out stays silent — the cascade in `MaterialGameSounds` reads a
 * missing entry as "nothing to play" — and a game that wants a sound there declares one in `sounds`.
 *
 * The `...AtOnce` moves get their own file rather than replaying the single-item one. Three cards landing
 * together do not sound like one card played three times, and playing the same sample once for the whole batch
 * is exactly what makes a batch feel like it lost its items on the way.
 *
 * Every file named here must exist in `sounds/`: `yarn check-sounds` fails the publish otherwise, because a
 * name that is in the table and not on the bucket costs a failed request on every game start, in every game.
 */
export const defaultSounds: Record<SoundKit, Partial<Record<ItemMoveType, MaterialSoundConfig>>> = {
  [SoundKit.Card]: {
    [ItemMoveType.Move]: defaultSound('card-move.mp3', 0.25),
    [ItemMoveType.MoveAtOnce]: defaultSound('card-move-at-once.mp3', 0.25),
    [ItemMoveType.Create]: defaultSound('card-create.mp3', 0.25),
    [ItemMoveType.CreateAtOnce]: defaultSound('card-create-at-once.mp3', 0.25),
    [ItemMoveType.Delete]: defaultSound('card-delete.mp3', 0.2),
    [ItemMoveType.DeleteAtOnce]: defaultSound('card-delete-at-once.mp3', 0.2),
    [ItemMoveType.Shuffle]: defaultSound('card-shuffle.mp3', 0.3)
  },
  [SoundKit.Cardboard]: {
    [ItemMoveType.Move]: defaultSound('cardboard-move.mp3', 0.25),
    [ItemMoveType.MoveAtOnce]: defaultSound('cardboard-move-at-once.mp3', 0.25),
    [ItemMoveType.Create]: defaultSound('cardboard-create.mp3', 0.25),
    [ItemMoveType.CreateAtOnce]: defaultSound('cardboard-create-at-once.mp3', 0.25),
    [ItemMoveType.Delete]: defaultSound('cardboard-delete.mp3', 0.2),
    [ItemMoveType.DeleteAtOnce]: defaultSound('cardboard-delete-at-once.mp3', 0.2),
    [ItemMoveType.Shuffle]: defaultSound('cardboard-shuffle.mp3', 0.3)
  },
  [SoundKit.Wood]: {
    [ItemMoveType.Move]: defaultSound('wood-move.mp3', 0.25),
    [ItemMoveType.MoveAtOnce]: defaultSound('wood-move-at-once.mp3', 0.25),
    [ItemMoveType.Create]: defaultSound('wood-create.mp3', 0.25),
    [ItemMoveType.CreateAtOnce]: defaultSound('wood-create-at-once.mp3', 0.25),
    [ItemMoveType.Delete]: defaultSound('wood-delete.mp3', 0.2),
    [ItemMoveType.DeleteAtOnce]: defaultSound('wood-delete-at-once.mp3', 0.2),
    [ItemMoveType.Shuffle]: defaultSound('wood-shuffle.mp3', 0.3)
  },
  // Coins are the piercing one of the six: same gestures, consistently quieter.
  [SoundKit.Metal]: {
    [ItemMoveType.Move]: defaultSound('metal-move.mp3', 0.2),
    [ItemMoveType.MoveAtOnce]: defaultSound('metal-move-at-once.mp3', 0.2),
    [ItemMoveType.Create]: defaultSound('metal-create.mp3', 0.2),
    [ItemMoveType.CreateAtOnce]: defaultSound('metal-create-at-once.mp3', 0.2),
    [ItemMoveType.Delete]: defaultSound('metal-delete.mp3', 0.15),
    [ItemMoveType.DeleteAtOnce]: defaultSound('metal-delete-at-once.mp3', 0.15),
    [ItemMoveType.Shuffle]: defaultSound('metal-shuffle.mp3', 0.25)
  },
  [SoundKit.Plastic]: {
    [ItemMoveType.Move]: defaultSound('plastic-move.mp3', 0.25),
    [ItemMoveType.MoveAtOnce]: defaultSound('plastic-move-at-once.mp3', 0.25),
    [ItemMoveType.Create]: defaultSound('plastic-create.mp3', 0.25),
    [ItemMoveType.CreateAtOnce]: defaultSound('plastic-create-at-once.mp3', 0.25),
    [ItemMoveType.Delete]: defaultSound('plastic-delete.mp3', 0.2),
    [ItemMoveType.DeleteAtOnce]: defaultSound('plastic-delete-at-once.mp3', 0.2),
    [ItemMoveType.Shuffle]: defaultSound('plastic-shuffle.mp3', 0.3)
  },
  // A die is picked up and set down like any other piece, so it borrows those gestures; rolling is the one
  // sound that belongs to dice alone, and the one players actually listen for.
  [SoundKit.Dice]: {
    [ItemMoveType.Roll]: defaultSound('dice-roll.mp3', 0.35),
    [ItemMoveType.Move]: defaultSound('dice-move.mp3', 0.2),
    [ItemMoveType.MoveAtOnce]: defaultSound('dice-move-at-once.mp3', 0.2),
    [ItemMoveType.Create]: defaultSound('dice-create.mp3', 0.2),
    [ItemMoveType.CreateAtOnce]: defaultSound('dice-create-at-once.mp3', 0.2),
    [ItemMoveType.Delete]: defaultSound('dice-delete.mp3', 0.15),
    [ItemMoveType.DeleteAtOnce]: defaultSound('dice-delete-at-once.mp3', 0.15)
  }
}
