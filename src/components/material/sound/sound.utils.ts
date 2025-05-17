import { MaterialSoundConfig } from './MaterialSoundConfig'


export const ensureMaterialSoundConfig = (sound: string | MaterialSoundConfig | false): MaterialSoundConfig | undefined => {
  if (sound === false) return
  if (typeof sound === 'string') {
    return { sound: sound }
  } else {
    return sound
  }
}
