import fscreen from 'fscreen'
import NoSleep from 'nosleep.js'
// @ts-ignore (@type/o9n does not exist yet)
import {orientation} from 'o9n'
import {useEffect, useState} from 'react'

const noSleep = new NoSleep()

export function useFullscreen() {
  const [fullscreen, setFullscreen] = useState(!fscreen.fullscreenEnabled)

  const toggleFullscreen = () => fullscreen ? fscreen.exitFullscreen() : fscreen.requestFullscreen(document.getElementById('root')!)

  const onFullscreenChange = () => {
    setFullscreen(fscreen.fullscreenElement != null)
    if (fscreen.fullscreenElement) {
      orientation.lock('landscape')
        .then(() => noSleep.enable())
        .catch(() => console.info('screen orientation cannot be locked on this device'))
    } else {
      noSleep.disable()
    }
  }

  useEffect(() => {
    fscreen.addEventListener('fullscreenchange', onFullscreenChange)
    return () => {
      fscreen.removeEventListener('fullscreenchange', onFullscreenChange)
    }
  }, [])

  return {fullscreen, toggleFullscreen, setFullscreen}
}