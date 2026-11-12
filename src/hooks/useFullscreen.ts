import fscreen from 'fscreen'
import NoSleep from 'nosleep.js'
import {useContext, useEffect, useState} from 'react'
import {gameContext} from '../components'
import {isFramedByPlatform, onPlatformFullscreenChange, requestPlatformFullscreen} from '../utilities/platform.util'

const noSleep = new NoSleep()

export const useFullscreen = () => {
  // Framed by the platform, the hosting page goes full screen rather than this frame alone: what the platform shows over
  // the game (its notification center) would be hidden otherwise
  const framed = isFramedByPlatform()
  const [fullscreen, setFullscreen] = useState(!fscreen.fullscreenEnabled)
  // The orientation locked in full screen (phones), none for a game that plays either way
  const gameOrientation = useContext(gameContext).orientation ?? 'landscape'
  const lockedOrientation = gameOrientation === 'any' ? undefined : gameOrientation

  const toggleFullscreen = () => {
    if (framed) requestPlatformFullscreen(!fullscreen, lockedOrientation)
    else if (fullscreen) fscreen.exitFullscreen()
    else fscreen.requestFullscreen(document.getElementById('root')!)
  }

  useEffect(() => {
    if (framed) {
      return onPlatformFullscreenChange((platformFullscreen) => {
        setFullscreen(platformFullscreen)
        if (platformFullscreen) noSleep.enable()
        else noSleep.disable()
      })
    }
    const onFullscreenChange = () => {
      setFullscreen(fscreen.fullscreenElement != null)
      if (fscreen.fullscreenElement) {
        // The screen stays awake whether or not the orientation locks
        noSleep.enable()
        if (lockedOrientation) {
          // Inside a promise so that a missing API (old browsers) rejects like an unsupported lock (iOS, desktop)
          Promise.resolve().then(() => screen.orientation.lock(lockedOrientation))
            .catch(() => console.info('screen orientation cannot be locked on this device'))
        }
      } else {
        noSleep.disable()
      }
    }
    fscreen.addEventListener('fullscreenchange', onFullscreenChange)
    return () => {
      fscreen.removeEventListener('fullscreenchange', onFullscreenChange)
    }
  }, [framed, lockedOrientation])

  return {fullscreen, toggleFullscreen, setFullscreen}
}
