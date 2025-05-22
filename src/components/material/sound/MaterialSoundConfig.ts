export class MaterialSoundConfig {
  public sound: string
  public volume?: number
  public loop?: boolean
  public startsAt?: number
  public endsAt?: number
  public duration?: number
  public speed?: number
  public delay?: number

  constructor(sound: string) {
    this.sound = sound

  }
}
