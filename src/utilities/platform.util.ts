import { PLATFORM_URI } from '@gamepark/react-client'

const platformOrigin = new URL(PLATFORM_URI).origin

/**
 * The platform frames the game client in its own pages (a game, a tutorial), so that its installed app keeps playing
 * full screen. The client then asks the hosting page to navigate, instead of navigating its own frame.
 */
export function isFramedByPlatform() {
  if (window.self === window.top) return false
  // ancestorOrigins is missing in Firefox, where the referrer is the page that loaded the frame
  const parentOrigin = window.location.ancestorOrigins?.[0] ?? (document.referrer ? new URL(document.referrer).origin : undefined)
  return parentOrigin === platformOrigin
}

/** Opens a page of the platform. The page hosting the game navigates to it without reloading, when there is one. */
export function goToPlatform(url: string) {
  if (isFramedByPlatform()) {
    window.parent.postMessage({ type: 'navigate', url }, platformOrigin)
  } else {
    // Framed elsewhere, the platform must not load inside the frame: the click lets the game navigate the whole window
    window.open(url, '_top')
  }
}

/** The platform page of a game: where to play it, and where to come back after signing in */
export function platformGameUrl(gameId: string, locale: string) {
  return `${PLATFORM_URI}/${locale}/games/${gameId}`
}

/** Tells the page hosting the client that it now plays another game (a rematch), so that its address follows */
export function notifyGameChanged(gameId: string) {
  if (isFramedByPlatform()) {
    window.parent.postMessage({ type: 'game-changed', gameId }, platformOrigin)
  }
}

/**
 * A game opened directly on its subdomain (a link sent before games moved into the platform pages, a bookmark) goes to
 * its platform page, which frames this client. Neither in local development, nor for the tutorials, which have no game.
 * Returns whether the page is leaving.
 */
export function redirectToPlatformGamePage() {
  if (window.self !== window.top || !window.location.hostname.endsWith('.game-park.com')) return false
  const query = new URLSearchParams(window.location.search)
  const gameId = query.get('game')
  if (!gameId) return false
  const locale = query.get('locale')
  // Without a locale, the platform picks the language of the browser
  window.location.replace(locale ? platformGameUrl(gameId, locale) : `${PLATFORM_URI}/?id=${encodeURIComponent(gameId)}`)
  return true
}
