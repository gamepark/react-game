import i18next, {InitOptions, Resource} from 'i18next'
import ICU from 'i18next-icu'
import dayjs from 'dayjs'
import 'dayjs/locale/de'
import 'dayjs/locale/fr'
import 'dayjs/locale/ru'
import {initReactI18next} from 'react-i18next'

export function setupTranslation(translations: Resource, options?: InitOptions) {
  i18next.use(initReactI18next).use(ICU)

  const query = new URLSearchParams(window.location.search)
  const locale = query.get('locale') || 'en'

  i18next.init({
    lng: locale,
    debug: process.env.NODE_ENV === 'development',
    fallbackLng: 'en',
    keySeparator: false,
    nsSeparator: false,
    resources: translations,
    ...options
  }).catch(error => console.error(error))

  dayjs.locale(locale)
}