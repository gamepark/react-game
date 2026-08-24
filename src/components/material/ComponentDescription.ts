import { getEnumValues, ItemMoveType } from '@gamepark/rules-api'
import { defaultSounds, MaterialSoundConfig, SoundKit } from './sound'
import { ensureMaterialSoundConfig } from './sound/sound.utils'

/**
 * Base class for components displayed on the game table by the framework.
 * Contains all features common to items and locations display.
 */
export abstract class ComponentDescription<Id = any> {

  constructor(clone?: Partial<Pick<ComponentDescription, 'height' | 'width' | 'ratio' | 'borderRadius'>>) {
    this.height = clone?.height
    this.width = clone?.width
    this.ratio = clone?.ratio
    this.borderRadius = clone?.borderRadius ?? 0
  }

  /**
   * All the sounds for each move type
   */
  sounds?: Partial<Record<ItemMoveType, string | MaterialSoundConfig | false>>

  /**
   * How this component sounds when it is handled, which decides the sounds the framework plays for it without
   * the game listing any. Undefined means this component makes no sound of its own — the default for anything
   * the library cannot guess, and the right answer for a board, which never moves.
   *
   * The component classes the library ships set it to what they are: {@link CardDescription} sounds like a
   * card, {@link CubicDiceDescription} like dice. {@link TokenDescription} is the one worth overriding, since
   * tokens are the material whose sound genuinely differs from game to game — see {@link SoundKit}.
   */
  soundKit?: SoundKit

  /**
   * Sound the framework falls back to when {@link sounds} declares nothing for that move type. Reads
   * {@link soundKit}; override it for a component whose sound depends on the item rather than on the class.
   *
   * A method rather than a getter on purpose. `target: esnext` implies `useDefineForClassFields`, so a
   * subclass writing `sounds = {...}` *defines* the property and would blank out a base-class getter instead
   * of extending it. A method lives on the prototype and is overridden the way it reads.
   *
   * @param moveType the type of move being animated
   * @returns the sound, `false` to stay silent, or undefined when this component has no default
   */
  getDefaultSound(moveType: ItemMoveType): string | MaterialSoundConfig | false | undefined {
    return this.soundKit === undefined ? undefined : defaultSounds[this.soundKit][moveType]
  }

  /**
   * Every sound this component can play, so they are all fetched and decoded before the game starts.
   *
   * Both what the game declares in {@link sounds} and what {@link getDefaultSound} falls back to: a
   * default that is only discovered when the move happens would be silent the first time it plays,
   * which is the one time anybody notices.
   */
  getSounds(): (string | MaterialSoundConfig)[] {
    return itemMoveTypes
      .flatMap(moveType => [this.sounds?.[moveType], this.getDefaultSound(moveType)])
      .map(sound => ensureMaterialSoundConfig(sound))
      .filter((sound): sound is MaterialSoundConfig => sound !== undefined)
  }

  /**
   * All the images that can be used to display the component, and therefore should be preloaded with the web page.
   */
  abstract getImages(): string[]

  /**
   * Height of the component.
   */
  height?: number

  /**
   * Width of the component.
   */
  width?: number

  /**
   * Ratio (width/height) of the component.
   */
  ratio?: number

  /**
   * Returns the size of component. Default will be process from {@link width}, {@link height} and {@link ratio}.
   * @param _id id of the component to display (material or location).
   * @returns {ComponentSize} The size
   */
  getSize(_id: Id): ComponentSize {
    if (this.width && this.height) return { width: this.width, height: this.height }
    if (this.ratio && this.width) return { width: this.width, height: this.width / this.ratio }
    if (this.ratio && this.height) return { width: this.height * this.ratio, height: this.height }
    throw new Error(`${this.constructor.name}: you must implement "getSize" or 2 of "width", "height" & "ratio" in any Component description`)
  }

  /**
   * Border radius of the component.
   */
  borderRadius: number

  /**
   * Returns the border radius of the component. Default to {@link borderRadius}
   * @param _id id of the component to display (material or location).
   * @returns {number | undefined} The border radius
   */
  getBorderRadius(_id: Id): number {
    return this.borderRadius
  }
}

const itemMoveTypes = getEnumValues(ItemMoveType)

/**
 * Size of a component on the game table, in centimeters.
 */
export type ComponentSize = {
  width: number
  height: number
}
