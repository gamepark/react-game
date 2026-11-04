import { useEffect } from 'react'

const replayKey = (gameName: string) => `devtools.replay.${gameName}`

/**
 * The same game again from its setup: same players, same cards, no move played.
 * @return false when this game has no state in the local storage
 */
export const replayGame = (gameName: string): boolean => {
  const raw = localStorage.getItem(gameName)
  if (!raw) return false
  const store = JSON.parse(raw)
  localStorage.setItem(gameName, JSON.stringify({ ...store, state: store.setup, actions: [] }))
  localStorage.setItem(replayKey(gameName), String(Date.now()))
  return true
}

/** A storage event only reaches the other tabs: they are still showing the moves that were just removed. */
export const useReloadOnReplay = (gameName: string) => {
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === replayKey(gameName)) window.location.reload()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [gameName])
}
