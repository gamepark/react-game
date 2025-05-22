import { Animation } from '@gamepark/react-client'
import { MaterialMove, MoveKind } from '@gamepark/rules-api'
import { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useAnimation, useMaterialContext } from '../../../hooks'
import { gameContext } from '../../GameProvider'
import { MaterialGameAnimations } from '../animations'
import { AudioLoader } from './AudioLoader'
import { MaterialSoundConfig } from './MaterialSoundConfig'
import { MaterialSoundLoader } from './MaterialSoundLoader'
import { ensureMaterialSoundConfig } from './sound.utils'

type MaterialGameSoundsProps = {
  onSoundsLoad?: () => void
  ambiance?: string | MaterialSoundConfig
}

let ambianceLoadPromise: Promise<void> | undefined
const getAmbianceLoadPromise = (audioLoader: AudioLoader, sound: string | MaterialSoundConfig) => {
  if (!ambianceLoadPromise) {
    ambianceLoadPromise = audioLoader.load([sound])
  }

  return ambianceLoadPromise
}
export const MaterialGameSounds: FC<MaterialGameSoundsProps> = ({ onSoundsLoad, ambiance }) => {
  const context = useMaterialContext()
  const audioLoader = useMemo(() => new AudioLoader(), [])
  const [audioLoaderStatus, setAudioLoaderStatus] = useState(audioLoader.status())
  const [audioLoaded, setAudioLoaded] = useState(false)
  const animationsConfig = useContext(gameContext).animations as MaterialGameAnimations
  const material = useContext(gameContext).material
  const animation = useAnimation<MaterialMove>()
  const muted = useSelector((state: { soundsMuted: boolean }) => state.soundsMuted)
  useEffect(() => {
    if (!animation) return
    const config = animationsConfig.getAnimationConfig(animation.move, { ...context, action: animation.action })
    let materialSoundConfig: MaterialSoundConfig | undefined
    if (config?.s !== undefined) {
      materialSoundConfig = ensureMaterialSoundConfig(config.s)
    } else if (animation.move.kind === MoveKind.ItemMove) {
      materialSoundConfig = ensureMaterialSoundConfig(material![animation.move.itemType]?.sounds?.[animation.move.type])
    }

    if (!materialSoundConfig) return

    playSound(audioLoader, prepareConfig(materialSoundConfig, animation))
  }, [animation?.move])


  useEffect(() => {
    if (!muted) {
      audioLoader.unmute()
    } else {
      audioLoader.mute()
    }
    // eslint-disable-next-line
  }, [muted])


  useEffect(() => {
    if (audioLoaderStatus === 'running' && audioLoaded) {
      audioLoader.loop(ambiance!)
    }
  }, [audioLoaderStatus, audioLoaded])

  const changeAudioLoaderStatus = useCallback(()  => {
    if (audioLoaded) return
    audioLoader.resume().then(() => {
      setAudioLoaderStatus(audioLoader.status())
      document.removeEventListener('mousedown', changeAudioLoaderStatus)
    })
  }, [audioLoaded])

  useEffect(() => {
    if (!ambiance || audioLoaded) return
    getAmbianceLoadPromise(audioLoader, ambiance).then(() => setAudioLoaded(true))

    document.addEventListener('mousedown', changeAudioLoaderStatus)

    return () => {
      document.removeEventListener('mousedown', changeAudioLoaderStatus)
    }
    // eslint-disable-next-line
  }, [])


  return (
    <MaterialSoundLoader onSoundsLoad={onSoundsLoad} audioLoader={audioLoader}/>
  )
}

const playSound = (audioLoader: AudioLoader, config: MaterialSoundConfig) => {
  if (config.delay) {
    setTimeout(() => audioLoader.play(config), config.delay * 1000)
  } else {
    audioLoader.play(config)
  }
}

const prepareConfig = (materialSoundConfig: MaterialSoundConfig, animation: Animation) => {
  const newConfig = JSON.parse(JSON.stringify(materialSoundConfig))
  newConfig.delay = Math.min(animation.duration - 0.2, materialSoundConfig.delay ?? 0)
  newConfig.duration = materialSoundConfig.duration ?? animation.duration
  return newConfig
}
