import { useCallback, useState } from 'react'

export type DevToolsTheme = 'night' | 'day'

const STORAGE_KEY = 'devtools.theme'

/** Shared by all the games: storage may be unavailable, the theme is then simply not remembered. */
const loadTheme = (): DevToolsTheme => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'day' ? 'day' : 'night'
  } catch {
    return 'night'
  }
}

export const useDevToolsTheme = () => {
  const [theme, setTheme] = useState<DevToolsTheme>(loadTheme)

  const toggleTheme = useCallback(() => {
    const next: DevToolsTheme = theme === 'day' ? 'night' : 'day'
    setTheme(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private window or blocked storage: only this page has the new theme.
    }
  }, [theme])

  return { theme, toggleTheme }
}
