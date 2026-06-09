import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'

export const SUPPORTED_LANGUAGES = ['en', 'zh-CN'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const LANGUAGE_STORAGE_KEY = 'jean.ui.language'

export function isSupportedLanguage(
  value: unknown
): value is SupportedLanguage {
  return (
    typeof value === 'string' &&
    (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
  )
}

const resources = {
  en: { translation: en },
  'zh-CN': { translation: zhCN },
} as const

function detectInitialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'en'
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (isSupportedLanguage(stored)) return stored
  } catch {
    // localStorage may throw in private mode — fall through
  }
  return 'en'
}

void i18n.use(initReactI18next).init({
  resources,
  lng: detectInitialLanguage(),
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
  interpolation: {
    escapeValue: false, // React already escapes
  },
  returnNull: false,
})

export default i18n
export { i18n }
