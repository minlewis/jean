import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import {
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
  type SupportedLanguage,
} from '@/i18n/config'

export interface UseUILanguageResult {
  /** 当前语言,一定在 supported set 内 */
  language: SupportedLanguage
  /** 切换语言 + 持久化到 localStorage */
  setLanguage: (lang: SupportedLanguage) => void
  /** react-i18next 的翻译函数 */
  t: ReturnType<typeof useTranslation>['t']
  /** 支持的语言清单(用于渲染切换器) */
  supportedLanguages: typeof SUPPORTED_LANGUAGES
}

export function useUILanguage(): UseUILanguageResult {
  const { i18n, t } = useTranslation()

  const language: SupportedLanguage = isSupportedLanguage(i18n.language)
    ? i18n.language
    : 'en'

  const setLanguage = useCallback(
    (lang: SupportedLanguage) => {
      void i18n.changeLanguage(lang)
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
      } catch {
        // localStorage may throw in private mode — language change still applied in-memory
      }
    },
    [i18n]
  )

  return {
    language,
    setLanguage,
    t,
    supportedLanguages: SUPPORTED_LANGUAGES,
  }
}
