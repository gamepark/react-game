import i18next, {InitOptions} from 'i18next'
import ICU from 'i18next-icu'
import HttpBackend from 'i18next-http-backend'
import dayjs from 'dayjs'
import 'dayjs/locale/de'
import 'dayjs/locale/fr'
import 'dayjs/locale/ru'
import {initReactI18next} from 'react-i18next'

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
    debug: process.env.NODE_ENV === 'development',
    fallbackLng: 'en',
    ns: [gameId, 'common', 'credits'],
    defaultNS: gameId,
    backend: {
      loadPath: 'https://translations.game-park.com/{{lng}}/{{ns}}.json'
    },
    ...options
  }).catch(error => console.error(error))

  dayjs.locale(locale)
}