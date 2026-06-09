import { GlobeIcon } from 'lucide-react'

import { useUILanguage } from '@/hooks/useUILanguage'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type LanguageSwitcherProps = {
  /** Optional className for the outer wrapper */
  className?: string
  /** Optional className for the Select trigger */
  triggerClassName?: string
  /** Show the "Interface language" description below the label */
  showDescription?: boolean
}

const LANGUAGE_OPTION_KEYS = {
  en: 'switcherOptions.en',
  'zh-CN': 'switcherOptions.zh-CN',
} as const

/**
 * i18n language picker. Self-contained — drop into any Settings pane.
 * Persists to localStorage; reads back on next mount via i18n/config.
 */
export function LanguageSwitcher({
  className,
  triggerClassName,
  showDescription = true,
}: LanguageSwitcherProps) {
  const { language, setLanguage, t, supportedLanguages } = useUILanguage()

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label
        htmlFor="ui-language-select"
        className="flex items-center gap-2 text-sm font-medium"
      >
        <GlobeIcon className="size-4 text-muted-foreground" />
        {t('switcher.label')}
      </Label>
      {showDescription && (
        <p className="text-muted-foreground text-xs">
          {t('switcher.description')}
        </p>
      )}
      <Select
        value={language}
        onValueChange={value => {
          if (value === 'en' || value === 'zh-CN') {
            setLanguage(value)
          }
        }}
      >
        <SelectTrigger
          id="ui-language-select"
          className={cn('w-full sm:w-64', triggerClassName)}
          data-testid="ui-language-select-trigger"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {supportedLanguages.map(code => (
            <SelectItem key={code} value={code}>
              {t(LANGUAGE_OPTION_KEYS[code])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default LanguageSwitcher
