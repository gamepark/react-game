import uniqBy from 'lodash/uniqBy'
import React, { useContext, useEffect, useMemo } from 'react'
import { gameContext } from '../../GameProvider'
import { MaterialGameAnimations } from '../animations'
import { AudioLoader } from './AudioLoader'
import { MaterialSoundConfig } from './MaterialSoundConfig'

type MaterialSoundLoaderProps = {
  audioLoader: AudioLoader
  onSoundsLoad?: () => void,
}

export const MaterialSoundLoader: React.FunctionComponent<MaterialSoundLoaderProps> = ({ audioLoader, onSoundsLoad }) => {
  const context = useContext(gameContext)
  const animationsConfig = context.animations as MaterialGameAnimations

  const sounds = useMemo(() => {
    const sounds: (string | MaterialSoundConfig)[] = []
    for (const description of Object.values(context.material ?? {})) {
      if (description) sounds.push(...Object.values(description.sounds ?? {}))
    }

    sounds.push(...animationsConfig.getSounds())
    return uniqBy(sounds, (s) => typeof s === 'string' ? s : s.sound)
  }, [context.material, context.animations])

  useEffect(() => {
    audioLoader.load(sounds).then(() => {
      onSoundsLoad?.()
    })
    // eslint-disable-next-line
  }, [sounds])

  return null
}
