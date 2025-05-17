import { MaterialMove, MoveKind } from '@gamepark/rules-api'
import { FC, useContext, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useAnimation, useMaterialContext } from '../../../hooks'
import { gameContext } from '../../GameProvider'
import { MaterialGameAnimations } from '../animations'
import { AudioLoader } from './AudioLoader'
import { MaterialSoundLoader } from './MaterialSoundLoader'
import { ensureMaterialSoundConfig } from './sound.utils'

type MaterialGameSoundsProps = {
  onSoundsLoad?: () => void
  ambiance?: string
}

export const MaterialGameSounds: FC<MaterialGameSoundsProps> = ({  onSoundsLoad, ambiance }) => {
  const context = useMaterialContext()
  const [ambianceEnabled, setAmbianceEnabled] = useState(false);
  const [ambianceFail, setAmbianceFail] = useState(false);
  const animationsConfig = useContext(gameContext).animations as MaterialGameAnimations
  const material = useContext(gameContext).material
  const animation = useAnimation<MaterialMove>()
  const muted = useSelector((state: {soundsMuted: boolean}) => state.soundsMuted)
  const audioLoader = useMemo(() => new AudioLoader(), [])
  useEffect(() => {
    if (!animation) return
      const config = animationsConfig.getAnimationConfig(animation.move, { ...context, action: animation.action })
      if (config?.s !== undefined) {
        const materialSound = ensureMaterialSoundConfig(config.s)
        if (!materialSound) return
        materialSound.duration = animation.duration ?? materialSound.duration
        audioLoader.play(materialSound);
      } else if (animation.move.kind === MoveKind.ItemMove){
        const materialSound = material![animation.move.itemType]?.sounds?.[animation.move.type]
        if (materialSound) {
          audioLoader.play(materialSound)
        }
      }
  }, [animation?.move])


  useEffect(() => {
    if (!muted) {
      audioLoader.unmute()
    } else {
      audioLoader.mute();
    }
    // eslint-disable-next-line
  }, [muted])


  useEffect(() => {
    if (!ambiance) return
    // If the user hasn't click on the page before the audio context is loaded, the ambiance sound won't be run.
    // Then we add an event on the document to enable the ambiance only if it has failed.
    if (audioLoader.status() === 'suspended') {
      setAmbianceFail(true)
    } else {
      audioLoader.loop(ambiance);
    }
    // eslint-disable-next-line
  }, [ambiance])

  useEffect(() => {
    const enableAmbiance = () => {
      if (!ambiance) return
      audioLoader.loop(ambiance);
      setAmbianceEnabled(true);
    }

    if (ambianceFail && !ambianceEnabled) {
      document.addEventListener('click', enableAmbiance)
    }

    return () => {
      document.removeEventListener('click', enableAmbiance)
    }
    // eslint-disable-next-line
  }, [ambianceFail, ambianceEnabled])


  return (
    <MaterialSoundLoader onSoundsLoad={onSoundsLoad} audioLoader={audioLoader} ambiance={ambiance} />
  );
}
