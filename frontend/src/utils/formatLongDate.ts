import type { Language } from '@/i18n/translate'

export function formatLongDate(date: Date | string, language: Language): string {
  return new Date(date).toLocaleDateString(language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
