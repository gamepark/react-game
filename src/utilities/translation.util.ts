import { PLATFORM_URI } from '@gamepark/react-client'
import dayjs from 'dayjs'
import 'dayjs/locale/de'
import 'dayjs/locale/fr'
import 'dayjs/locale/ru'
import i18next, { InitOptions } from 'i18next'
import HttpBackend from 'i18next-http-backend'
import ICU from 'i18next-icu'
import { initReactI18next } from 'react-i18next'

let translationInitialized = false

/**
 * Setup i18next global instance.
 * @param gameId The game identifier used as the default namespace
 * @param options i18next options
 */
export const setupTranslation = (gameId: string, options?: InitOptions) => {
  if (translationInitialized) {
    return
  }

  translationInitialized = true

  i18next.use(initReactI18next).use(ICU).use(HttpBackend)

  const query = new URLSearchParams(window.location.search)
  const locale = query.get('locale') || 'en'
  document.documentElement.lang = locale

  i18next.init({
    lng: locale,
    debug: import.meta.env.VITE_I18N_DEBUG === 'true',
    fallbackLng: 'en',
    ns: [gameId, 'common', 'credits'],
    defaultNS: gameId,
    backend: {
      loadPath: (_lngs: string[], namespaces: string[]) => {
        const ns = namespaces[0]
        if (ns === gameId) {
          return `/translation/{{lng}}.json`
        }
        return 'https://translations.game-park.com/{{lng}}/{{ns}}.json'
      }
    },
    saveMissing: process.env.NODE_ENV === 'production',
    missingKeyHandler: (lngs, namespace, key, defaultValue) => {
      const locale = lngs[0]
      if (!locale || !namespace || !key) return
      if (/_zero|_one|_two|_few|_many|_other$/.test(key)) return
      try {
        const body = JSON.stringify({ locale, namespace, key, defaultValue, origin: window.location.href })
        navigator.sendBeacon(`${PLATFORM_URI}/api/translations/missing`, new Blob([body], { type: 'text/plain' }))
      } catch (error) {
        console.error('[Translation] Failed to report missing key:', error)
      }
    },
    ...options
  }).catch(error => console.error(error))

  dayjs.locale(locale)
}