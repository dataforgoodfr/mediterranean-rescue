import { useEffect, type ReactNode } from 'react'
import { LanguageContext } from './context.ts'
import { direction, type Language } from './translate.ts'

// Donne la langue à toute l'app, et la reporte sur <html lang dir> pour les lecteurs d'écran
// et le sens de lecture.
export function LanguageProvider({
  language,
  children,
}: {
  language: Language
  children: ReactNode
}) {
  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = direction(language)
  }, [language])

  return <LanguageContext value={language}>{children}</LanguageContext>
}
