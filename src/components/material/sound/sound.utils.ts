import { MaterialSoundConfig } from './MaterialSoundConfig'


export const ensureMaterialSoundConfig = (sound?: string | MaterialSoundConfig | false): MaterialSoundConfig | undefined => {
  if (!sound) return
  if (typeof sound === 'string') {
    return { sound: sound }
  } else {
    return sound
  }
}
