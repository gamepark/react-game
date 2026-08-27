import { ItemMove, ItemMoveType } from '@gamepark/rules-api'
import { MaterialSoundConfig } from './MaterialSoundConfig'

/**
 * Where the framework's own sounds are published.
 *
 * The files live in `sounds/` at the root of this repository and are pushed to that bucket by
 * `yarn sync-sounds`, which `yarn publish` runs. Adding a default sound is therefore: drop the `.wav` in
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
  Coin,
  Chip,
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
 * The rustle of a rulebook page, played when a dialog the player asked for opens — a material help, a
 * tutorial popup. Not every dialog: what it marks is text arriving to be read.
 *
 * It is declared here rather than next to the hook that plays it so that `check-sounds` sees it: that script
 * reads this file alone, and a default sound named anywhere else is a URL nothing guards against a rename.
 */
export const openDialogSound = defaultSound('open-help.wav', 0.4)

/**
 * The moves animated back-to-back with the one being resolved, in the same action.
 *
 * Some moves only make sense counted. `Material.rollItems()` produces one {@link RollItem} per die, so a
 * player throwing five dice produces five moves that the framework animates one after the other — and a
 * handful of dice thrown together is not the sound of one die, played five times. This is what lets a kit
 * pick the sound of the gesture rather than the sound of the move.
 */
export type SoundBatch = {
  /** How many moves of that same kind are animated in a row, this one included. */
  size: number
  /** Whether this move opens the run. A kit that plays one sound for the whole batch stays silent otherwise. */
  first: boolean
}

/**
 * What a kit sounds like.
 *
 * Deliberately not one entry per {@link ItemMoveType}: whether an item is created, moved, deleted or moved
 * along with ten others, what the player hears is the same piece being handled. Only two things genuinely
 * sound different, and they are the two exceptions below.
 */
type SoundKitSounds = {
  /** The piece being handled: created, moved, deleted, alone or in a batch. */
  handle: MaterialSoundConfig
  /** Played instead of {@link handle} when the move reveals something the player did not know. */
  reveal?: MaterialSoundConfig
  /** Several items rolled together. Without it, a rolled item just sounds handled. */
  roll?: MaterialSoundConfig
  /** A single item rolled. */
  rollOne?: MaterialSoundConfig
}

/**
 * Shuffling is the one sound that does not depend on the kit: what is heard is items sliding over each other,
 * and a bag of tokens shaken is close enough to a deck riffled that a second file would buy nothing. Any kit
 * shuffles with this one.
 */
const shuffleSound = defaultSound('shuffle.wav', 0.4)

const soundKits: Record<SoundKit, SoundKitSounds> = {
  // `reveal` is what makes a card different from every other material: drawing one is the moment a player
  // learns something, and hearing that it happened is information, not decoration.
  [SoundKit.Card]: {
    handle: defaultSound('card-play.wav', 0.4),
    reveal: defaultSound('card-draw.wav', 0.4)
  },
  [SoundKit.Cardboard]: { handle: defaultSound('cardboard-token.wav', 0.4) },
  [SoundKit.Wood]: { handle: defaultSound('wood-token.wav', 0.4) },
  // Coins are the piercing one of the six, so they sit a notch lower than the rest.
  [SoundKit.Coin]: { handle: defaultSound('coin-token.wav', 0.3) },
  [SoundKit.Chip]: { handle: defaultSound('chip-token.wav', 0.4) },
  // Rolling belongs to this kit rather than to every kit, so that a game with no dice does not download the
  // two roll samples to never play them. A material that rolls without being dice sounds handled, and a game
  // that wants otherwise picks this kit for it.
  [SoundKit.Dice]: {
    handle: defaultSound('dice-move.wav', 0.4),
    roll: defaultSound('dice-roll.wav', 0.5),
    rollOne: defaultSound('one-die-roll.wav', 0.5)
  }
}

/**
 * The sounds a kit plays for one move, in the order they are scheduled, or none when the move is better
 * left silent.
 *
 * Silence is a real answer here, and it is the one given to {@link ItemMoveType.Select}: selecting fires when
 * a player merely designates an item, several times a turn and often just to look at it, so a click on every
 * one of them turns into a stutter.
 *
 * @param kit the kit the material was given
 * @param move the move being animated
 * @param batch the moves animated in a row with it, see {@link SoundBatch}
 * @returns the sounds to play, empty to stay silent
 */
export const getSoundKitMoveSounds = (kit: SoundKit, move: ItemMove, batch: SoundBatch): MaterialSoundConfig[] => {
  const sounds = soundKits[kit]
  switch (move.type) {
    case ItemMoveType.Select:
      return []
    case ItemMoveType.Shuffle:
      return [shuffleSound]
    case ItemMoveType.Roll:
      // One sound for the whole throw, chosen by how many dice it was: the rest of the batch stays silent
      // rather than firing the same sample once per die.
      if (!batch.first) return []
      return [(batch.size > 1 ? sounds.roll : sounds.rollOne) ?? sounds.handle]
    case ItemMoveType.Move:
    case ItemMoveType.MoveAtOnce:
      // A piece that travels is heard where it lands, not where it left: the handling sound waits for the end
      // of the animation. Every other move type is heard at once, because nothing is travelling.
      //
      // A revealed item is the one case with two sounds. `reveal` is filled by HiddenMaterialRules with what
      // this very player did not know before the move, so it already answers "did *I* just learn something" —
      // and learning it happens at the start, when the item turns over, while the landing still has to be
      // heard. The two are a gesture, not a choice between two samples.
      return move.reveal !== undefined && sounds.reveal
        ? [sounds.reveal, atEnd(sounds.handle)]
        : [atEnd(sounds.handle)]
    default:
      return [sounds.handle]
  }
}

/** Same sound, heard when the animation ends. The table holds shared objects, so this never mutates one. */
const atEnd = (sound: MaterialSoundConfig): MaterialSoundConfig => ({ ...sound, atEnd: true })

/**
 * Every sound a kit can play, so they are all fetched and decoded before the game starts.
 *
 * A default that is only discovered when the move happens would be silent the first time it plays, which is
 * the one time anybody notices. This list must therefore stay exactly what {@link getSoundKitMoveSounds} can
 * return — no more, or every game pays for samples it never plays.
 *
 * @param kit the kit, or undefined for a material that makes no sound of its own
 * @returns the sounds to preload
 */
export const getSoundKitSounds = (kit?: SoundKit): MaterialSoundConfig[] => {
  if (kit === undefined) return []
  const { handle, reveal, roll, rollOne } = soundKits[kit]
  return [handle, shuffleSound, reveal, roll, rollOne].filter((sound): sound is MaterialSoundConfig => sound !== undefined)
}
