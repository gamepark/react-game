import { useContext, useEffect, useState, useSyncExternalStore } from 'react'
import { gameContext } from '../../GameProvider'
import { MaterialGameAnimations } from '../animations'
import { hasExplicitSounds, subscribeToExplicitSounds } from './explicitSounds'
import { MaterialGameSounds } from './MaterialGameSounds'

/**
 * The `<MaterialGameSounds/>` {@link GameProvider} mounts on every game's behalf, so the sounds the framework
 * gives materials by default are heard without each game having to remember to mount the component. Half the
 * games never did, and a default nobody hears is not a default.
 *
 * It stands down as soon as a game mounts its own — see {@link registerExplicitSounds} for why two instances
 * cannot coexist. That is what lets the games already mounting it, some with an `ambiance` or an
 * `onSoundsLoad` of their own, keep working untouched: their instance wins, this one goes quiet, and their
 * `App.tsx` can be cleaned up later or never.
 */
export const DefaultMaterialGameSounds = () => {
  const context = useContext(gameContext)
  const explicit = useSyncExternalStore(subscribeToExplicitSounds, hasExplicitSounds, hasExplicitSounds)

  // Deliberately one commit late. On the first render nothing below has mounted yet, so a game's own instance
  // has not registered and this one would mount, play the loading of every sound, then unmount — leaving a
  // stray AudioContext behind. Waiting for a passive effect means every layout effect underneath has run.
  const [settled, setSettled] = useState(false)
  useEffect(() => setSettled(true), [])

  if (!settled || explicit) return null
  // GameProvider serves games that are not built on the material framework at all. Their animations are a
  // plain `Animations`, with none of the sound configuration this component reads.
  if (!context.material || !(context.animations instanceof MaterialGameAnimations)) return null
  return <MaterialGameSounds implicit/>
}
