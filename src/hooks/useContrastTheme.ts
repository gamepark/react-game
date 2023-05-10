import { useCallback, useState } from 'react'
import { Theme } from '@emotion/react'

export interface ContrastTheme {
  light: boolean
  toggleContrast: () => void
}

const THEME_STORAGE = 'light-theme'

export function useContrastTheme(defaultLight = false): ContrastTheme {
  const [light, setLight] = useState(() => getStoredTheme() ?? defaultLight)
  const toggleContrast = useCallback(() => setLight(light => {
    localStorage.setItem(THEME_STORAGE, JSON.stringify(!light))
    return !light
  }), [])
  return { light, toggleContrast }
}

function getStoredTheme() {
  const item = localStorage.getItem(THEME_STORAGE)
  if (!item) return
  const theme = JSON.parse(item)
  if (typeof theme !== 'boolean') return
  return theme
}

export function isContrastTheme(theme: Theme): theme is ContrastTheme {
  return typeof (theme as ContrastTheme).toggleContrast === 'function'
}