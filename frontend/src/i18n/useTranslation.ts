import { useContext } from 'react'
import { LanguageContext } from './context.ts'
import type { MessageKey } from './keys.ts'
import { translate } from './translate.ts'

// Dans un composant : `const t = useTranslation()`, puis `t('home.title')`.
export function useTranslation() {
  const language = useContext(LanguageContext)
  return (key: MessageKey, values?: Record<string, string>) => translate(language, key, values)
}
