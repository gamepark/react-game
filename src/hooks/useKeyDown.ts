import {useEffect} from 'react'

export const useKeyDown = (key: string, callback: () => void) => {
  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === key) {
        callback()
      }
    }
    document.addEventListener('keydown', onKeydown)
    return () => document.removeEventListener('keydown', onKeydown)
  }, [key, callback])
}
