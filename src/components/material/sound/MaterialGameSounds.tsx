import { Animation, useGameSelector } from '@gamepark/react-client'
import { MaterialMove, MoveKind } from '@gamepark/rules-api'
import { FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useAnimation, useMaterialContext } from '../../../hooks'
import { gameContext } from '../../GameProvider'
import { MaterialGameAnimations, MaterialAnimationContext } from '../animations'
import { MaterialDescriptionRecord } from '../MaterialDescription'
import { AudioLoader } from './AudioLoader'
import { MaterialSoundConfig } from './MaterialSoundConfig'
import { MaterialSoundLoader } from './MaterialSoundLoader'
import { registerExplicitSounds } from './explicitSounds'
import { ensureMaterialSoundConfig } from './sound.utils'
import { useYourTurnSound } from './useYourTurnSound'

type MaterialGameSoundsProps = {
  onSoundsLoad?: () => void
  ambiance?: string | MaterialSoundConfig
  /**
   * @internal Set only by the instance {@link GameProvider} mounts on the game's behalf. It marks this
   * instance as the fallback one, so it does not count itself as the game's own mount and stand down
   * against itself. Games must never pass it.
   */
  implicit?: boolean
}

let ambianceLoadPromise: Promise<void> | undefined
const getAmbianceLoadPromise = (audioLoader: AudioLoader, sound: string | MaterialSoundConfig) => {
  if (!ambianceLoadPromise) {
    ambianceLoadPromise = audioLoader.load([sound])
  }

  return ambianceLoadPromise
}
export const MaterialGameSounds: FC<MaterialGameSoundsProps> = ({ onSoundsLoad, ambiance, implicit }) => {
  const context = useMaterialContext()
  const audioLoader = useMemo(() => new AudioLoader(), [])
  const [audioLoaderStatus, setAudioLoaderStatus] = useState(audioLoader.status())
  const [audioLoaded, setAudioLoaded] = useState(false)
  const animationsConfig = useContext(gameContext).animations as MaterialGameAnimations
  const material = useContext(gameContext).material
  const animation = useAnimation<MaterialMove>()
  const muted = useGameSelector((state) => state.soundsMuted)

  // A layout effect, not a passive one: the provider's fallback instance settles in a passive effect, which
  // React runs after every layout effect below it. Registering here is what makes "the game mounted its own"
  // already true by the time that decision is taken.
  useLayoutEffect(() => implicit ? undefined : registerExplicitSounds(), [implicit])

  useYourTurnSound(audioLoader)

  useEffect(() => {
    if (!animation) return
    const materialSoundConfig = resolveSound(animation.move, { ...context, action: animation.action }, animationsConfig, material)

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

/**
 * Resolve which sound an animation plays, most specific configuration first:
 *
 * 1. what the animation API configures for this very move (see `getSoundConfig`),
 * 2. the sound the material description declares for that move type,
 * 3. the default sound the material description falls back to.
 *
 * Each level may hold `false`, meaning "explicitly silent". That stops the cascade rather than letting the
 * next level speak: a game that silences a move must not be given the library's default sound instead.
 * `undefined` is the only value that means "not configured here, ask the next level" — which is why the
 * levels below test against `undefined` and not for truthiness.
 */
const resolveSound = <P extends number, M extends number, L extends number, R extends number, V extends number>(
  move: MaterialMove<P, M, L, R, V>,
  context: MaterialAnimationContext<P, M, L, R, V>,
  animations: MaterialGameAnimations<P, M, L, R, V>,
  material?: Partial<MaterialDescriptionRecord<P, M, L, R, V>>
): MaterialSoundConfig | undefined => {
  const configured = animations.getSoundConfig(move, context)
  if (configured !== undefined) return ensureMaterialSoundConfig(configured)

  if (move.kind !== MoveKind.ItemMove) return undefined
  const description = material?.[move.itemType]
  if (!description) return undefined

  const declared = description.sounds?.[move.type]
  if (declared !== undefined) return ensureMaterialSoundConfig(declared)

  return ensureMaterialSoundConfig(description.getDefaultSound(move.type))
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
