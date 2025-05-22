import { MaterialSoundConfig } from './MaterialSoundConfig'

export class AudioLoader {
  private readonly audioContext: AudioContext
  private sources: { url: string, id: string }[] = []
  private readonly buffers: { [id: string]: AudioBuffer }
  private readonly sounds: { [id: string]: { sourceNode: AudioBufferSourceNode, gainNode: GainNode, volume: number } }
  private muted: boolean = false

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    this.buffers = {}
    this.sounds = {}
  }

  public async load(sources: (string | MaterialSoundConfig)[]): Promise<any> {
    this.sources = sources.map((s) => typeof s === 'string' ? { id: s, url: s } : { id: s.sound, url: s.sound })
    if (!sources.length) return Promise.resolve()
    return Promise.all(this.sources.map(async source =>
      fetch(new Request(source.url))
        .then(response => response.arrayBuffer())
        .then((buffer) => this.audioContext.decodeAudioData(buffer, (b) => {
          this.buffers[source.id] = b
        }))
    ))
  }

  public play(soundConfig: string | MaterialSoundConfig) {
    const config = typeof soundConfig === 'string' ? new MaterialSoundConfig(soundConfig) : soundConfig
    const id = config.sound
    this.sounds[id] = this.sounds[id] || {}

    const sound = this.sounds[id]
    sound.volume = config.volume ?? 1
    sound.sourceNode = this.audioContext.createBufferSource()
    sound.sourceNode.buffer = this.buffers[id]
    sound.sourceNode.loop = config.loop ?? false
    sound.sourceNode.playbackRate.value = config.speed ?? 1

    if (!sound.gainNode) {
      sound.gainNode = this.audioContext.createGain()
      sound.gainNode.connect(this.audioContext.destination)
    }

    sound.sourceNode.connect(sound.gainNode)
    sound.gainNode.gain.value = this.muted? 0: (config.volume ?? 1)

    sound.sourceNode.start(0, config.startsAt ?? 0, config.duration)
  }

  public status() {
    return this.audioContext.state
  }

  public loop(sound: string | MaterialSoundConfig) {
    return this.play(sound)
  }

  public volume(id: string, volume: number) {
    this.sounds[id].gainNode.gain.value = volume
  }

  public resume() {
    this.audioContext.resume()
  }

  /**
   * Mute is a simple volume = 0 because suspending the audio context only create a "pause" on sound
   */
  public mute() {
    this.muted = true
    Object.values(this.sounds).forEach(sound => {
      sound.gainNode.gain.value = 0
    })
  }

  public unmute() {
    this.muted = false
    Object.values(this.sounds).forEach(sound => {
      sound.gainNode.gain.value = (sound.volume || 1)
    })
  }
}
