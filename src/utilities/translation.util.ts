import dayjs from 'dayjs'
import 'dayjs/locale/de'
import 'dayjs/locale/fr'
import 'dayjs/locale/ru'
import i18next, { InitOptions } from 'i18next'
import HttpBackend from 'i18next-http-backend'
import ICU from 'i18next-icu'
import { initReactI18next } from 'react-i18next'

let translationInitialized = false
const reportedKeys = new Set<string>()

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
      loadPath: (_lng: string, ns: string) => {
        if (ns === gameId) {
          return `/translation/{{lng}}.json`
        }
        return `https://game-park.com/translations/{{ns}}/{{lng}}.json`
      }
    },
    saveMissing: true,
    missingKeyHandler: (lngs, namespace, key) => {
      const locale = lngs[0]
      if (!locale || !namespace || !key) return
      if (/_zero|_one|_two|_few|_many|_other$/.test(key)) return
      const cacheKey = `${locale}:${namespace}:${key}`
      if (reportedKeys.has(cacheKey)) return
      reportedKeys.add(cacheKey)
      const msg = `[Translation] Missing key: ${namespace}|${key} (locale: ${locale})`
      if (process.env.NODE_ENV === 'production') {
        console.error(msg)
      } else {
        console.warn(msg)
      }
    },
    ...options
  }).catch(error => console.error(error))

  dayjs.locale(locale)
}