import { Animation, DisplayedAction, useGameSelector } from '@gamepark/react-client'
import { ItemMove, MaterialMove, MoveKind } from '@gamepark/rules-api'
import { FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useAnimation, useMaterialContext } from '../../../hooks'
import { gameContext } from '../../GameProvider'
import { MaterialGameAnimations, MaterialAnimationContext } from '../animations'
import { MaterialDescriptionRecord } from '../MaterialDescription'
import { AudioLoader } from './AudioLoader'
import { SoundBatch } from './defaultSounds'
import { MaterialSoundConfig } from './MaterialSoundConfig'
import { MaterialSoundLoader } from './MaterialSoundLoader'
import { registerExplicitSounds } from './explicitSounds'
import { ensureMaterialSoundConfig } from './sound.utils'
import { useDialogSound } from './useDialogSound'
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
  useDialogSound(audioLoader)

  useEffect(() => {
    if (!animation) return
    const sounds = resolveSounds(animation.move, { ...context, action: animation.action }, animationsConfig, material)

    for (const sound of sounds) {
      playSound(audioLoader, prepareConfig(sound, animation))
    }
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
 * Resolve which sounds an animation plays, most specific configuration first:
 *
 * 1. what the animation API configures for this very move (see `getSoundConfig`),
 * 2. the sound the material description declares for that move type,
 * 3. the default sounds the material description falls back to.
 *
 * Each level may hold `false`, meaning "explicitly silent". That stops the cascade rather than letting the
 * next level speak: a game that silences a move must not be given the library's default sound instead.
 * `undefined` is the only value that means "not configured here, ask the next level" — which is why the
 * levels below test against `undefined` and not for truthiness.
 *
 * Only the last level answers with more than one sound, and that asymmetry is deliberate: a game configuring
 * a move states the sound it wants to hear, while the defaults describe a gesture that may well have two.
 */
const resolveSounds = <P extends number, M extends number, L extends number, R extends number, V extends number>(
  move: MaterialMove<P, M, L, R, V>,
  context: MaterialAnimationContext<P, M, L, R, V>,
  animations: MaterialGameAnimations<P, M, L, R, V>,
  material?: Partial<MaterialDescriptionRecord<P, M, L, R, V>>
): MaterialSoundConfig[] => {
  const configured = animations.getSoundConfig(move, context)
  if (configured !== undefined) return asList(ensureMaterialSoundConfig(configured))

  if (move.kind !== MoveKind.ItemMove) return []
  const description = material?.[move.itemType]
  if (!description) return []

  const declared = description.sounds?.[move.type]
  if (declared !== undefined) return asList(ensureMaterialSoundConfig(declared))

  return description.getDefaultSounds(move, getSoundBatch(context.action, move))
}

const asList = (sound?: MaterialSoundConfig): MaterialSoundConfig[] => sound ? [sound] : []

/**
 * How many moves of the same kind are animated in a row around this one, and whether it opens the run.
 *
 * Consequences of an action are animated strictly one after the other, so a rule pushing
 * `...dice.rollItems()` shows up here as N separate moves in N separate animations. Counting them is what
 * lets a sound be the sound of the gesture — five dice thrown — instead of one sample fired five times.
 *
 * The run is the *contiguous* one on purpose: two throws separated by something else are two throws, and
 * moves are compared by kind rather than by content because what a batch means is "these happened together",
 * not "these were identical".
 */
const getSoundBatch = <P extends number, M extends number, L extends number, R extends number, V extends number>(
  action: DisplayedAction<MaterialMove<P, M, L, R, V>, P> | undefined,
  move: ItemMove<P, M, L>
): SoundBatch => {
  const moves = action ? [action.move, ...action.consequences] : []
  // Identity, not index arithmetic: `getAnimatedMove` hands back the very object stored in the action, and
  // recomputing its position from `played` and the animation step duplicates a rule that lives elsewhere.
  const index = moves.indexOf(move as MaterialMove<P, M, L, R, V>)
  if (index === -1) return { size: 1, first: true }

  const sameKind = (other: MaterialMove<P, M, L, R, V>) =>
    other.kind === MoveKind.ItemMove && other.type === move.type && other.itemType === move.itemType

  let first = index
  while (first > 0 && sameKind(moves[first - 1])) first--
  let last = index
  while (last < moves.length - 1 && sameKind(moves[last + 1])) last++

  return { size: last - first + 1, first: index === first }
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
  // `atEnd` is the moment the item touches down, so its delay is the whole animation and any configured
  // delay is an offset from there — a negative one pulls the sound slightly ahead of the contact, which a
  // sample with a slow attack may want. Without it, a delay is still clamped inside the animation, since a
  // sound configured to start after its animation is over is a mistake, not an intent.
  newConfig.delay = materialSoundConfig.atEnd
    ? animation.duration + (materialSoundConfig.delay ?? 0)
    : Math.min(animation.duration - 0.2, materialSoundConfig.delay ?? 0)
  // Deliberately *not* clamped to the animation. Cutting a sample the moment the item stops moving chops the
  // tail off every default sound — a card landing lasts longer than the 0.2s a dropped item is animated for —
  // and the cut is abrupt, so it clicks. A sound that must not outlast its animation says so with `duration`.
  newConfig.duration = materialSoundConfig.duration
  return newConfig
}
