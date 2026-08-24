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

  /**
   * Fetch and decode every sound, and resolve once they have all been tried.
   *
   * A sound that cannot be fetched or decoded is reported and skipped, never rethrown. Callers wait on this
   * promise to take the loading screen down — `onSoundsLoad` — so a rejection here does not degrade the sound,
   * it strands the player on the loading screen forever. One missing file must cost its own sound and nothing
   * else, which matters all the more now that the framework gives materials sounds the game never listed and
   * may not have published yet.
   */
  public async load(sources: (string | MaterialSoundConfig)[]): Promise<any> {
    this.sources = sources.map((s) => typeof s === 'string' ? { id: s, url: s } : { id: s.sound, url: s.sound })
    if (!sources.length) return Promise.resolve()
    return Promise.all(this.sources.map(async source => {
      try {
        const response = await fetch(new Request(source.url))
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        this.buffers[source.id] = await this.audioContext.decodeAudioData(await response.arrayBuffer())
      } catch (error) {
        console.warn(`Could not load sound ${source.url}`, error)
      }
    }))
  }

  public play(soundConfig: string | MaterialSoundConfig) {
    const config = typeof soundConfig === 'string' ? new MaterialSoundConfig(soundConfig) : soundConfig
    const id = config.sound
    this.sounds[id] = this.sounds[id] || {}

    // A sound whose file failed to load has no buffer. Playing on regardless would start a source node with a
    // null buffer, which never fires `ended` and leaks a node per move for the rest of the game.
    if (!this.buffers[id]) return

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

    if (config.duration !== Infinity) {
      sound.sourceNode.start(0, config.startsAt ?? 0, config.duration)
    }
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
    return this.audioContext.resume()
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
