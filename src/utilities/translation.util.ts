import dayjs from 'dayjs'
import 'dayjs/locale/de'
import 'dayjs/locale/es'
import 'dayjs/locale/fr'
import 'dayjs/locale/it'
import 'dayjs/locale/ru'
import updateLocale from 'dayjs/plugin/updateLocale'
import i18next, { InitOptions } from 'i18next'
import HttpBackend from 'i18next-http-backend'
import ICU from 'i18next-icu'
import { initReactI18next } from 'react-i18next'

dayjs.extend(updateLocale)

// dayjs humanize() displays singular durations as words ("un jour"), which looks odd once prefixed with a
// sign ("-un jour"). Override the singular relativeTime labels with their numeric form for supported locales.
const numericSingularRelativeTime: Record<string, Record<string, string>> = {
  en: { d: '1 day', M: '1 month', y: '1 year' },
  fr: { d: '1 jour', M: '1 mois', y: '1 an' },
  de: { d: '1 Tag', M: '1 Monat', y: '1 Jahr' },
  es: { d: '1 día', M: '1 mes', y: '1 año' },
  it: { d: '1 giorno', M: '1 mese', y: '1 anno' },
  ru: { d: '1 день', M: '1 месяц', y: '1 год' }
}
for (const [locale, overrides] of Object.entries(numericSingularRelativeTime)) {
  const relativeTime = dayjs.Ls[locale]?.relativeTime
  if (relativeTime) {
    dayjs.updateLocale(locale, { relativeTime: { ...relativeTime, ...overrides } })
  }
}

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
    ...import.meta.hot && {
      react: { bindI18nStore: 'added' },
      i18nFormat: { bindI18nStore: 'added' }
    },
    backend: {
      loadPath: (_lngs: string[], namespaces: string[]) => {
        const ns = namespaces[0]
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

  if (import.meta.hot) {
    import.meta.hot.on('translation-update', () => i18next.reloadResources())
  }
}