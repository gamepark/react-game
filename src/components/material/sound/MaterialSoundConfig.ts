export class MaterialSoundConfig {
  public sound: string
  public volume?: number
  public loop?: boolean
  public startsAt?: number
  public endsAt?: number
  public duration?: number
  public speed?: number
  public delay?: number
  /**
   * Play when the animation ends instead of when it starts, `delay` counting from there.
   *
   * This exists because the sound of an item is not always the sound of it leaving. A piece that travels is
   * heard when it touches down, and only the player knows how long it travels — the material description
   * declares its sounds long before any of them is animated. So the intent is stated here and the delay is
   * computed against the animation.
   */
  public atEnd?: boolean

  constructor(sound: string) {
    this.sound = sound

  }
}
